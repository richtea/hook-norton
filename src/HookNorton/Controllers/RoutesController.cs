using System.Net.Mime;
using HookNorton.Models;
using HookNorton.Services;
using Microsoft.AspNetCore.Mvc;
using ILogger = Serilog.ILogger;

namespace HookNorton.Controllers;

[ApiController]
[Route("$$/api/routes")]
public class RoutesController : ControllerBase
{
    private readonly RouteConfigStore _routeStore;
    private readonly ILogger _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="RoutesController"/> class.
    /// </summary>
    /// <param name="routeStore">The route configuration store.</param>
    /// <param name="logger">The logger.</param>
    public RoutesController(RouteConfigStore routeStore, ILogger logger)
    {
        _routeStore = routeStore;
        _logger = logger;
    }

    /// <summary>
    /// Gets all configured routes.
    /// </summary>
    /// <returns>A list of all configured routes.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(RouteCollectionModel), 200, MediaTypeNames.Application.Json)]
    public IActionResult GetAllRoutes()
    {
        var routes = _routeStore.GetAll();
        return Ok(new RouteCollectionModel { Routes = routes });
    }

    /// <summary>
    /// Gets a specific route by method and URL-encoded path pattern.
    /// </summary>
    /// <param name="method">The HTTP method.</param>
    /// <param name="urlEncodedPath">The URL-encoded path pattern.</param>
    /// <returns>The route configuration if found, otherwise Not Found.</returns>
    [HttpGet("{method}/{*urlEncodedPath}")]
    [ProducesResponseType(typeof(RouteConfiguration), 200, MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ProblemDetails), 404, MediaTypeNames.Application.ProblemJson)]
    public IActionResult GetRoute(string method, string urlEncodedPath)
    {
        var pathPattern = Uri.UnescapeDataString(urlEncodedPath);
        var result = _routeStore.Get(method, pathPattern);
        return result.ToActionResult(this, Request.Path);
    }

    /// <summary>
    /// Creates or updates a route configuration.
    /// </summary>
    /// <param name="method">The HTTP method.</param>
    /// <param name="urlEncodedPath">The URL-encoded path pattern.</param>
    /// <param name="requestModel">The route update request.</param>
    /// <returns>The created or updated route configuration.</returns>
    [HttpPut("{method}/{*urlEncodedPath}")]
    [ProducesResponseType(typeof(RouteConfiguration), 200, MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(RouteConfiguration), 201, MediaTypeNames.Application.Json)]
    [ProducesResponseType(typeof(ProblemDetails), 409, MediaTypeNames.Application.ProblemJson)]
    [ProducesResponseType(typeof(ProblemDetails), 422, MediaTypeNames.Application.ProblemJson)]
    public IActionResult UpsertRoute(
        string method,
        string urlEncodedPath,
        [FromBody] RouteUpdateRequestModel requestModel)
    {
        var pathPattern = Uri.UnescapeDataString(urlEncodedPath);

        // Get the current version if route exists
        var existingResult = _routeStore.Get(method, pathPattern);
        int? expectedVersion = existingResult.IsSuccess ? existingResult.Value.Version : null;

        var route = new RouteConfiguration
        {
            Method = method,
            PathPattern = pathPattern,
            Response = requestModel.Response,
            Enabled = requestModel.Enabled,
        };

        var result = _routeStore.Upsert(route, expectedVersion);

        if (result.IsFailure)
        {
            return result.ToActionResult(this, Request.Path);
        }

        // Return 201 Created for new routes, 200 OK for updates
        if (expectedVersion == null)
        {
            return CreatedAtAction(nameof(GetRoute), new { method, urlEncodedPath }, result.Value);
        }

        return Ok(result.Value);
    }

    /// <summary>
    /// Deletes a specific route.
    /// </summary>
    /// <param name="method">The HTTP method.</param>
    /// <param name="urlEncodedPath">The URL-encoded path pattern.</param>
    /// <returns>No Content if deleted, otherwise Not Found.</returns>
    [HttpDelete("{method}/{*urlEncodedPath}")]
    [ProducesResponseType(204)]
    [ProducesResponseType(typeof(ProblemDetails), 404, MediaTypeNames.Application.ProblemJson)]
    public IActionResult DeleteRoute(string method, string urlEncodedPath)
    {
        var pathPattern = Uri.UnescapeDataString(urlEncodedPath);
        var result = _routeStore.Delete(method, pathPattern);
        return result.ToActionResult(this, Request.Path);
    }

    /// <summary>
    /// Clears all route configurations.
    /// </summary>
    /// <returns>No Content.</returns>
    [HttpDelete]
    [ProducesResponseType(204)]
    public IActionResult ClearAllRoutes()
    {
        _routeStore.Clear();
        return NoContent();
    }
}
