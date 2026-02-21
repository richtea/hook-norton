using Projects;

#pragma warning disable ASPIREPIPELINES003

var builder = DistributedApplication.CreateBuilder(args);

builder.AddDockerComposeEnvironment("compose")
    .WithDashboard(false);

// The API project needs to be published as a Docker Compose service so that we can generate
// a container image for it - we never actually deploy it to a Docker Compose environment, either as
// part of the local run scenario nor as part of the CI/CD pipeline
var faque = builder.AddProject<Faque>("faque")
    .WithHttpHealthCheck("/$$/health")
    .WithExternalHttpEndpoints()
    .PublishAsDockerComposeService((_, _) => { })
    .WithContainerBuildOptions(context =>
    {
        // Force the tag to be 'latest' so we can use that in the CI pipeline
        context.LocalImageTag = "latest";
    });

var webfrontend = builder.AddViteApp("webfrontend", "../frontend")
    .WithReference(faque)
    .WaitFor(faque)
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile(c =>

        // Generate a container image for the frontend so we can copy it into the API's wwwroot
        c.WithDockerfile(
                "../frontend",
                Path.Combine(c.ApplicationBuilder.AppHostDirectory, "webfrontend.Dockerfile"))

            // Build-time env for Vite: passed as Docker build args so "vite build" sees them when publishing
            .WithBuildArg("VITE_BASE_PATH", "/$$/web"));

// Copy built assets into API's wwwroot
faque.PublishWithContainerFiles(webfrontend, "./wwwroot");

builder.Build().Run();
