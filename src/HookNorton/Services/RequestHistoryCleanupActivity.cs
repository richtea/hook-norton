using HookNorton.Startup;
using Microsoft.Extensions.Options;
using ILogger = Serilog.ILogger;

namespace HookNorton.Services;

/// <summary>
/// Scoped activity which performs request history cleanup.
/// Safe to depend on scoped services like PersistenceService.
/// </summary>
public sealed class RequestHistoryCleanupActivity
{
    private readonly PersistenceService _persistence;
    private readonly RequestRecorder _recorder;
    private readonly HookNortonOptions _options;
    private readonly ILogger _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="RequestHistoryCleanupActivity"/> class.
    /// </summary>
    /// <param name="persistence">The persistence service.</param>
    /// <param name="recorder">The request recorder.</param>
    /// <param name="options">The application options.</param>
    /// <param name="logger">The logger.</param>
    public RequestHistoryCleanupActivity(
        PersistenceService persistence,
        RequestRecorder recorder,
        IOptions<HookNortonOptions> options,
        ILogger logger)
    {
        _persistence = persistence;
        _recorder = recorder;
        _options = options.Value;
        _logger = logger;
    }

    /// <summary>
    /// Runs the cleanup activity.
    /// </summary>
    /// <param name="cancellationToken">The cancellation token.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public Task RunAsync(CancellationToken cancellationToken)
    {
        try
        {
            cancellationToken.ThrowIfCancellationRequested();

            // Disk state (chronological order)
            var fileIds = _persistence.GetRequestFileIds();

            // In-memory state (chronological order, already bounded by RequestRecorder)
            var memoryIds = _recorder.GetAllRequestIds();

            // We keep only the latest N IDs that are currently in memory.
            // Anything on disk not in this set is considered stale.
            var idsToKeep = memoryIds
                .TakeLast(_options.MaxRequestHistory)
                .ToHashSet();

            var filesToDelete = fileIds
                .Where(id => !idsToKeep.Contains(id))
                .ToList();

            if (filesToDelete.Count > 0)
            {
                _logger.Debug(
                    "Cleaning up {Count} stale request files (keeping {KeepCount} IDs tracked in memory)",
                    filesToDelete.Count,
                    idsToKeep.Count);

                foreach (var id in filesToDelete)
                {
                    cancellationToken.ThrowIfCancellationRequested();
                    _persistence.DeleteRequest(id);
                }
            }
        }
        catch (OperationCanceledException)
        {
            // expected during shutdown
            throw;
        }
        catch (Exception ex)
        {
            _logger.Warning(ex, "Failed to cleanup stale request files");
        }

        return Task.CompletedTask;
    }
}
