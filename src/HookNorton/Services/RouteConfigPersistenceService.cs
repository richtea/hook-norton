using System.IO.Abstractions;
using System.Text.Json;
using HookNorton.Models;
using HookNorton.Startup;
using Microsoft.AspNetCore.Http.Json;
using Microsoft.Extensions.Options;
using Nito.AsyncEx;
using ILogger = Serilog.ILogger;

namespace HookNorton.Services;

/// <summary>
/// Background service that persists route configuration changes with debouncing.
/// </summary>
public class RouteConfigPersistenceService : BackgroundService
{
    private readonly RouteConfigStore _routeStore;

    private readonly HookNortonOptions _options;

    private readonly IFileSystem _fileSystem;

    private readonly ILogger _logger;

    private readonly SemaphoreSlim _saveSemaphore = new(1, 1);

    private readonly AsyncLock _saveLock = new();

    private readonly JsonSerializerOptions _jsonOptions;

    private DateTime _lastChangeTime = DateTime.MinValue;

    private bool _hasPendingChanges;

    /// <summary>
    /// Initializes a new instance of the <see cref="RouteConfigPersistenceService" /> class.
    /// </summary>
    /// <param name="routeStore">The route configuration store.</param>
    /// <param name="options">The application options.</param>
    /// <param name="fileSystem">The file system abstraction.</param>
    /// <param name="jsonOptions">The JSON options.</param>
    /// <param name="logger">The logger.</param>
    public RouteConfigPersistenceService(
        RouteConfigStore routeStore,
        IOptions<HookNortonOptions> options,
        IFileSystem fileSystem,
        IOptions<JsonOptions> jsonOptions,
        ILogger logger)
    {
        _routeStore = routeStore;
        _options = options.Value;
        _fileSystem = fileSystem;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions(jsonOptions.Value.SerializerOptions) { WriteIndented = true };

        // Subscribe to route changes
        _routeStore.RoutesChanged += OnRoutesChanged;
    }

    /// <summary>
    /// Loads routes from disk during startup.
    /// </summary>
    public void LoadRoutesFromDisk()
    {
        var optionsRouteConfigPath = _fileSystem.Path.GetFullPath(_options.RouteConfigPath);

        try
        {
            if (!_fileSystem.File.Exists(optionsRouteConfigPath))
            {
                _logger.Information(
                    "No route configuration file found at {Path}, starting with empty configuration",
                    optionsRouteConfigPath);
                return;
            }

            var json = _fileSystem.File.ReadAllText(optionsRouteConfigPath);
            var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

            var data = JsonSerializer.Deserialize<RouteConfigFile>(json, jsonOptions);
            if (data?.Routes != null)
            {
                _routeStore.LoadRoutes(data.Routes);
                _logger.Information(
                    "Loaded {Count} routes from {Path}",
                    data.Routes.Count,
                    optionsRouteConfigPath);
            }
        }
        catch (Exception ex)
        {
            _logger.Warning(
                ex,
                "Failed to load route configuration from {Path}, starting with empty configuration",
                optionsRouteConfigPath);
        }
    }

    /// <inheritdoc />
    public override void Dispose()
    {
        _routeStore.RoutesChanged -= OnRoutesChanged;
        _saveSemaphore.Dispose();
        base.Dispose();
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.Information("Route config persistence service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);

                bool shouldSave;
                using (await _saveLock.LockAsync(stoppingToken))
                {
                    var timeSinceLastChange = DateTime.UtcNow - _lastChangeTime;
                    shouldSave = _hasPendingChanges &&
                        (timeSinceLastChange.TotalSeconds >= _options.RouteConfigDebounceSeconds);
                }

                if (shouldSave)
                {
                    await SaveRoutesAsync(stoppingToken);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Expected during shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error in route config persistence service");
            }
        }

        // Final save on shutdown if there are pending changes
        if (_hasPendingChanges)
        {
            await SaveRoutesAsync(CancellationToken.None);
        }

        _logger.Information("Route config persistence service stopped");
    }

    private void OnRoutesChanged()
    {
        using (_saveLock.Lock())
        {
            _lastChangeTime = DateTime.UtcNow;
            _hasPendingChanges = true;
        }
    }

    private async Task SaveRoutesAsync(CancellationToken cancellationToken)
    {
        await _saveSemaphore.WaitAsync(cancellationToken);
        try
        {
            var routes = _routeStore.GetAll().ToList();
            var directory = _fileSystem.Path.GetDirectoryName(_options.RouteConfigPath);
            if (!string.IsNullOrEmpty(directory))
            {
                _fileSystem.Directory.CreateDirectory(directory);
            }

            var json = JsonSerializer.Serialize(new RouteConfigFile { Routes = routes }, _jsonOptions);

            // Atomic write with temp file
            var tempPath = $"{_options.RouteConfigPath}.tmp";
            await _fileSystem.File.WriteAllTextAsync(tempPath, json, cancellationToken);

            if (_fileSystem.File.Exists(_options.RouteConfigPath))
            {
                _fileSystem.File.Delete(_options.RouteConfigPath);
            }

            _fileSystem.File.Move(tempPath, _options.RouteConfigPath);

            using (await _saveLock.LockAsync(cancellationToken))
            {
                _hasPendingChanges = false;
            }

            _logger.Debug("Saved {Count} routes to {Path}", routes.Count, _options.RouteConfigPath);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save route configuration to {Path}", _options.RouteConfigPath);
        }
        finally
        {
            _saveSemaphore.Release();
        }
    }

    private class RouteConfigFile
    {
        public List<RouteConfiguration> Routes { get; init; } = [];
    }
}
