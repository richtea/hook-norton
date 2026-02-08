using System.IO.Abstractions;
using System.IO.Abstractions.TestingHelpers;
using HookNorton.Startup;
using Microsoft.AspNetCore.Mvc.Testing;
using Serilog;
using Serilog.Events;

namespace HookNorton.Integration.Tests.Infrastructure;

public sealed class IntegrationTestHost : IDisposable
{
    private IntegrationTestHost(MockFileSystem fileSystem, WebApplicationFactory<Program> factory)
    {
        FileSystem = fileSystem;
        Factory = factory;
        Client = factory.CreateClient();
    }

    public MockFileSystem FileSystem { get; }

    // ReSharper disable once MemberCanBePrivate.Global
    public WebApplicationFactory<Program> Factory { get; }

    public HttpClient Client { get; }

    public static IntegrationTestHost Create(Action<MockFileSystem>? seed = null)
    {
        var fileSystem = new MockFileSystem();
        seed?.Invoke(fileSystem);

        Log.Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
            .WriteTo.Console()
            .CreateLogger();

        var factory = new TestWebApplicationFactory(fileSystem);
        return new IntegrationTestHost(fileSystem, factory);
    }

    public void Dispose()
    {
        Client.Dispose();
        Factory.Dispose();
    }

    private sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
    {
        private readonly MockFileSystem _fileSystem;

        public TestWebApplicationFactory(MockFileSystem fileSystem)
        {
            _fileSystem = fileSystem;
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IFileSystem>(_fileSystem);
                services.PostConfigure<HookNortonOptions>(options =>
                {
                    options.DataDirectory = "/data";
                    options.RouteConfigDebounceSeconds = 0;
                });
            });
        }
    }
}
