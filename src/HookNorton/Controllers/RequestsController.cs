using HookNorton.Models;
using HookNorton.Services;
using Microsoft.AspNetCore.Mvc;
using ILogger = Serilog.ILogger;

namespace HookNorton.Controllers;

/// <summary>
/// Controller for managing captured requests.
/// </summary>
[ApiController]
[Route("$$/api/requests")]
[Produces("application/json")]
public class RequestsController : ControllerBase
{
    private readonly RequestRecorder _recorder;
    private readonly PersistenceService _persistence;
    private readonly ILogger _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="RequestsController"/> class.
    /// </summary>
    /// <param name="recorder">The request recorder.</param>
    /// <param name="persistence">The persistence service.</param>
    /// <param name="logger">The logger.</param>
    public RequestsController(
        RequestRecorder recorder,
        PersistenceService persistence,
        ILogger logger)
    {
        _recorder = recorder;
        _persistence = persistence;
        _logger = logger;
    }

    /// <summary>
    /// Gets all captured requests (summary view).
    /// </summary>
    /// <returns>A list of request summaries.</returns>
    [HttpGet]
    [ProducesResponseType(typeof(object), 200)]
    public IActionResult GetAllRequests()
    {
        var requests = _recorder.GetRequestSummaries();
        return Ok(new
        {
            requests,
            totalCount = requests.Count,
        });
    }

    /// <summary>
    /// Gets details for a specific captured request.
    /// </summary>
    /// <param name="id">The request ID.</param>
    /// <returns>The request record if found, otherwise Not Found.</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(RequestRecord), 200)]
    [ProducesResponseType(typeof(ProblemDetails), 404)]
    public IActionResult GetRequest(string id)
    {
        var result = _recorder.GetRequest(id);
        return result.ToActionResult(this, Request.Path);
    }

    /// <summary>
    /// Clears all captured requests.
    /// </summary>
    /// <returns>No Content.</returns>
    [HttpDelete]
    [ProducesResponseType(204)]
    public IActionResult ClearAllRequests()
    {
        _recorder.Clear();
        _persistence.ClearRequests();
        return NoContent();
    }
}
