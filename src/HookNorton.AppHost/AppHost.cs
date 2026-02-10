var builder = DistributedApplication.CreateBuilder(args);

var api = builder.AddProject<Projects.HookNorton>("api")
    .WithHttpHealthCheck("/$$/health")
    .WithExternalHttpEndpoints();

#pragma warning disable ASPIRECERTIFICATES001
builder.AddViteApp("webfrontend", "../frontend")
    .WithHttpsDeveloperCertificate()
    .WithReference(api)
    .WaitFor(api);

builder.Build().Run();
