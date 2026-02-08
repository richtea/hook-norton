using HookNorton.Startup;
using Microsoft.Extensions.Options;
using ILogger = Serilog.ILogger;

namespace HookNorton.Services;

/// <summary>
/// Background service that periodically cleans up stale request history files.
/// Must be singleton; creates a scope per cleanup run.
/// </summary>
public class RequestHistoryCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly HookNortonOptions _options;
    private readonly ILogger _logger;

    /// <summary>
    /// Initializes a new instance of the <see cref="RequestHistoryCleanupService"/> class.
    /// </summary>
    /// <param name="scopeFactory">The service scope factory.</param>
    /// <param name="options">The application options.</param>
    /// <param name="logger">The logger.</param>
    public RequestHistoryCleanupService(
        IServiceScopeFactory scopeFactory,
        IOptions<HookNortonOptions> options,
        ILogger logger)
    {
        _scopeFactory = scopeFactory;
        _options = options.Value;
        _logger = logger;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.Information(
            "Request history cleanup service started with interval of {Interval} seconds",
            _options.CleanupIntervalSeconds);

        // Wait a bit before first cleanup
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(TimeSpan.FromSeconds(_options.CleanupIntervalSeconds), stoppingToken);
                await CleanupStaleFilesAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                // Expected during shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error during request history cleanup");
            }
        }

        _logger.Information("Request history cleanup service stopped");
    }

    private async Task CleanupStaleFilesAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var activity = scope.ServiceProvider.GetRequiredService<RequestHistoryCleanupActivity>();
        await activity.RunAsync(cancellationToken);
    }
}
