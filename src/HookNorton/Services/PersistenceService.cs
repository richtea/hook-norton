using System.IO.Abstractions;
using System.Text.Json;
using HookNorton.Common;
using HookNorton.Models;
using HookNorton.Startup;
using Microsoft.Extensions.Options;
using ILogger = Serilog.ILogger;

namespace HookNorton.Services;

/// <summary>
/// Handles persistence of individual request records to filesystem.
/// Each request is stored as a separate JSON file named with its UUIDv7.
/// </summary>
public class PersistenceService
{
    private readonly HookNortonOptions _options;

    private readonly IFileSystem _fileSystem;

    private readonly ILogger _logger;

    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>
    /// Initializes a new instance of the <see cref="PersistenceService" /> class.
    /// </summary>
    /// <param name="options">The application options.</param>
    /// <param name="fileSystem">The file system abstraction.</param>
    /// <param name="logger">The logger.</param>
    public PersistenceService(
        IOptions<HookNortonOptions> options,
        IFileSystem fileSystem,
        ILogger logger)
    {
        _options = options.Value;
        _fileSystem = fileSystem;
        _logger = logger;
        _jsonOptions = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        };
    }

    /// <summary>
    /// Saves a request record to an individual file.
    /// </summary>
    /// <param name="request">The request record to save.</param>
    /// <returns>A successful <see cref="Result" /> if saved, otherwise an error.</returns>
    public Result SaveRequest(RequestRecord request)
    {
        try
        {
            var directory = _options.RequestHistoryPath;
            _fileSystem.Directory.CreateDirectory(directory);

            var filePath = _fileSystem.Path.Combine(directory, $"{request.Id}.json");
            var json = JsonSerializer.Serialize(request, _jsonOptions);

            // Use atomic write with temp file and move
            var tempPath = $"{filePath}.tmp";
            _fileSystem.File.WriteAllText(tempPath, json);

            if (_fileSystem.File.Exists(filePath))
            {
                _fileSystem.File.Delete(filePath);
            }

            _fileSystem.File.Move(tempPath, filePath);

            return Result.Success();
        }
        catch (IOException ex) when (_fileSystem.File.Exists(
            _fileSystem.Path.Combine(_options.RequestHistoryPath, $"{request.Id}.json")))
        {
            // File already exists (duplicate UUID - should be extremely rare)
            _logger.Warning(ex, "Request file already exists for ID {RequestId}", request.Id);
            return Result.Success(); // Gracefully handle duplicate
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to save request {RequestId}", request.Id);
            return Errors.Requests.PersistenceFailed(request.Id, ex.Message);
        }
    }

    /// <summary>
    /// Loads all request records from the history directory.
    /// Returns the latest N records based on UUIDv7 chronological order.
    /// </summary>
    /// <returns>A list of loaded <see cref="RequestRecord" /> instances.</returns>
    public Result<IReadOnlyList<RequestRecord>> LoadRequests()
    {
        try
        {
            var directory = _options.RequestHistoryPath;
            if (!_fileSystem.Directory.Exists(directory))
            {
                return Result<IReadOnlyList<RequestRecord>>.Success(Array.Empty<RequestRecord>());
            }

            var files = _fileSystem.Directory.GetFiles(directory, "*.json")
                .Where(f => !f.EndsWith(".tmp"))
                .OrderBy(path => _fileSystem.Path.GetFileNameWithoutExtension(path)) // UUIDv7 is sortable
                .TakeLast(_options.MaxRequestHistory)
                .ToList();

            var requests = new List<RequestRecord>();
            foreach (var file in files)
            {
                try
                {
                    var json = _fileSystem.File.ReadAllText(file);
                    var request = JsonSerializer.Deserialize<RequestRecord>(json, _jsonOptions);
                    if (request != null)
                    {
                        requests.Add(request);
                    }
                }
                catch (Exception ex)
                {
                    _logger.Warning(ex, "Failed to load request from {FilePath}", file);

                    // Continue loading other files
                }
            }

            return Result<IReadOnlyList<RequestRecord>>.Success(requests);
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to load requests from {Path}", _options.RequestHistoryPath);
            return Errors.Persistence.LoadFailed(_options.RequestHistoryPath, ex.Message);
        }
    }

    /// <summary>
    /// Deletes a specific request file.
    /// </summary>
    /// <param name="id">The request ID to delete.</param>
    /// <returns>A successful <see cref="Result" />.</returns>
    public Result DeleteRequest(string id)
    {
        try
        {
            var filePath = _fileSystem.Path.Combine(_options.RequestHistoryPath, $"{id}.json");
            if (_fileSystem.File.Exists(filePath))
            {
                _fileSystem.File.Delete(filePath);
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.Warning(ex, "Failed to delete request file {RequestId}", id);
            return Result.Success(); // Don't fail on delete errors
        }
    }

    /// <summary>
    /// Deletes all request files.
    /// </summary>
    /// <returns>A successful <see cref="Result" />.</returns>
    public Result ClearRequests()
    {
        try
        {
            var directory = _options.RequestHistoryPath;
            if (_fileSystem.Directory.Exists(directory))
            {
                foreach (var file in _fileSystem.Directory.GetFiles(directory, "*.json"))
                {
                    try
                    {
                        _fileSystem.File.Delete(file);
                    }
                    catch (Exception ex)
                    {
                        _logger.Warning(ex, "Failed to delete file {FilePath}", file);
                    }
                }
            }

            return Result.Success();
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Failed to clear request history");
            return Errors.Persistence.SaveFailed(_options.RequestHistoryPath, ex.Message);
        }
    }

    /// <summary>
    /// Gets all request file IDs in chronological order.
    /// </summary>
    /// <returns>A list of request IDs.</returns>
    public IReadOnlyList<string> GetRequestFileIds()
    {
        try
        {
            var directory = _options.RequestHistoryPath;
            if (!_fileSystem.Directory.Exists(directory))
            {
                return Array.Empty<string>();
            }

            return _fileSystem.Directory.GetFiles(directory, "*.json")
                .Where(f => !f.EndsWith(".tmp"))
                .Select(path => _fileSystem.Path.GetFileNameWithoutExtension(path))
                .OrderBy(id => id) // UUIDv7 is chronologically sortable
                .ToList();
        }
        catch (Exception ex)
        {
            _logger.Warning(ex, "Failed to get request file IDs");
            return Array.Empty<string>();
        }
    }
}
