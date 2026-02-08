using System.IO.Abstractions;
using Extensions.Hosting.AsyncInitialization;
using HookNorton.Services;
using Microsoft.Extensions.Options;
using ILogger = Serilog.ILogger;

namespace HookNorton.Startup;

/// <summary>
/// Handles the initialization of essential data for the application at startup.
/// Ensures the creation and validation of necessary data directories,
/// loads route configurations, and restores request history from persistent storage.
/// </summary>
public class InitialDataInitializer : IAsyncInitializer
{
    private readonly RouteConfigPersistenceService _routePersistence;

    private readonly IFileSystem _fileSystem;

    private readonly RequestRecorder _requestRecorder;

    private readonly PersistenceService _persistence;

    private readonly ILogger _logger;

    private readonly HookNortonOptions _options;

    public InitialDataInitializer(
        RouteConfigPersistenceService routePersistence,
        IFileSystem fileSystem,
        RequestRecorder requestRecorder,
        PersistenceService persistence,
        IOptions<HookNortonOptions> options,
        ILogger logger)
    {
        _routePersistence = routePersistence;
        _fileSystem = fileSystem;
        _requestRecorder = requestRecorder;
        _persistence = persistence;
        _logger = logger;
        _options = options.Value;
    }

    /// <inheritdoc />
    public Task InitializeAsync(CancellationToken cancellationToken)
    {
        // Ensure data directories exist
        try
        {
            var routeConfigDirectory = _fileSystem.Path.GetDirectoryName(_options.RouteConfigPath);
            if (!string.IsNullOrEmpty(routeConfigDirectory))
            {
                _fileSystem.Directory.CreateDirectory(routeConfigDirectory);
            }

            _fileSystem.Directory.CreateDirectory(_options.RequestHistoryPath);
            _logger.Information("Data directories created/verified");
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to create data directories");
        }

        // Load route configuration
        _routePersistence.LoadRoutesFromDisk();

        // Load request history
        var loadResult = _persistence.LoadRequests();
        if (loadResult.IsSuccess)
        {
            _requestRecorder.LoadRequests(loadResult.Value);
            _logger.Information("Loaded {Count} requests from history", loadResult.Value.Count);
        }
        else
        {
            _logger.Warning("Failed to load request history: {Error}", loadResult.Error.Message);
        }

        return Task.CompletedTask;
    }
}
