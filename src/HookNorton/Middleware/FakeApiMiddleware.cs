using System.Net.Mime;
using System.Text;
using HookNorton.Services;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using ILogger = Serilog.ILogger;

namespace HookNorton.Middleware;

/// <summary>
/// Middleware that handles the Fake API by matching incoming requests against configured routes
/// and recording all requests.
/// </summary>
public class FakeApiMiddleware
{
    private readonly ILogger _logger;

    private readonly RequestDelegate _next;

    private readonly ProblemDetailsFactory _problemDetailsFactory;

    /// <summary>
    /// Initializes a new instance of the <see cref="FakeApiMiddleware" /> class.
    /// </summary>
    /// <param name="next">The next middleware in the pipeline.</param>
    /// <param name="problemDetailsFactory">The problem details factory.</param>
    /// <param name="logger">The logger.</param>
    public FakeApiMiddleware(RequestDelegate next, ProblemDetailsFactory problemDetailsFactory, ILogger logger)
    {
        _next = next;
        _problemDetailsFactory = problemDetailsFactory;
        _logger = logger;
    }

    /// <summary>
    /// Invokes the middleware.
    /// </summary>
    /// <param name="context">The HTTP context.</param>
    /// <param name="routeMatcher">The route matcher service.</param>
    /// <param name="routeStore">The route configuration store.</param>
    /// <param name="recorder">The request recorder service.</param>
    /// <param name="persistence">The persistence service.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task InvokeAsync(
        HttpContext context,
        RouteMatcher routeMatcher,
        RouteConfigStore routeStore,
        RequestRecorder recorder,
        PersistenceService persistence)
    {
        var path = context.Request.Path.Value ?? "/";

        // Skip if this is a Developer API or Web UI request
        if (path.StartsWith("/$$/api/", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/$$/web/", StringComparison.OrdinalIgnoreCase) ||
            path.Equals("/$$/web", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        // Record the request
        await RecordRequestAsync(context, recorder, persistence);

        // Match against configured routes
        var routes = routeStore.GetAll();
        var matchResult = routeMatcher.FindMatch(context.Request.Method, path, routes);

        if (matchResult.IsSuccess)
        {
            var route = matchResult.Value;
            _logger.Debug(
                "Matched request {Method} {Path} to route {RouteMethod} {RoutePattern}",
                context.Request.Method,
                path,
                route.Method,
                route.PathPattern);

            // Return configured response
            context.Response.StatusCode = route.Response.StatusCode;

            foreach (var header in route.Response.Headers)
            {
                context.Response.Headers[header.Key] = header.Value;
            }

            if (!string.IsNullOrEmpty(route.Response.Body))
            {
                await context.Response.WriteAsync(route.Response.Body);
            }
        }
        else
        {
            // No route matched - return 404 with RFC 9457 Problem Details
            _logger.Debug("No route matched for {Method} {Path}", context.Request.Method, path);

            context.Response.StatusCode = 404;
            context.Response.ContentType = MediaTypeNames.Application.ProblemJson;

            var problemDetails = _problemDetailsFactory.CreateProblemDetails(
                context,
                404,
                "Not Found",
                detail: $"No route configured for {context.Request.Method} {path}",
                instance: path);

            await context.Response.WriteAsJsonAsync(
                problemDetails,
                options: null,
                contentType: MediaTypeNames.Application.ProblemJson);
        }
    }

    private async Task RecordRequestAsync(
        HttpContext context,
        RequestRecorder recorder,
        PersistenceService persistence)
    {
        try
        {
            // Read request body
            string body;
            context.Request.EnableBuffering();
            using (var reader = new StreamReader(
                       context.Request.Body,
                       Encoding.UTF8,
                       false,
                       1024,
                       true))
            {
                body = await reader.ReadToEndAsync();
                context.Request.Body.Position = 0;
            }

            // Extract headers
            var headers = context.Request.Headers
                .ToDictionary(h => h.Key, h => h.Value.ToString());

            // Extract query string
            var queryString = context.Request.QueryString.Value?.TrimStart('?') ?? string.Empty;

            // Record the request
            var recordResult = recorder.RecordRequest(
                context.Request.Method,
                context.Request.Path.Value ?? "/",
                queryString,
                headers,
                body);

            if (recordResult.IsSuccess)
            {
                // Persist asynchronously (fire and forget with error handling)
                _ = Task.Run(() =>
                {
                    var saveResult = persistence.SaveRequest(recordResult.Value);
                    if (saveResult.IsFailure)
                    {
                        _logger.Warning(
                            "Failed to persist request {RequestId}: {Error}",
                            recordResult.Value.Id,
                            saveResult.Error.Message);
                    }
                });

                return;
            }

            _logger.Warning("Failed to record request: {Error}", recordResult.Error.Message);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Error recording request");
        }
    }
}
