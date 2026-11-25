using System.Text.Json.Serialization;
using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding.Metadata;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

const string CorsFrontend = "Frontend";

// ---------- Base de datos SQLite ----------
// La ruta relativa del archivo .db se resuelve contra la carpeta del proyecto,
// así no importa desde qué carpeta se ejecute "dotnet run".
var sqlite = new SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("Bodegas"));
if (!Path.IsPathRooted(sqlite.DataSource))
    sqlite.DataSource = Path.Combine(builder.Environment.ContentRootPath, sqlite.DataSource);

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(sqlite.ToString()));
builder.Services.Configure<EmpresaOptions>(builder.Configuration.GetSection(EmpresaOptions.Seccion));

// ---------- Controladores y JSON ----------
builder.Services
    .AddControllers(options =>
    {
        // Los errores de validación usan los nombres del JSON (camelCase): "nombre", "estado"...
        options.ModelMetadataDetailsProviders.Add(new SystemTextJsonValidationMetadataProvider());
    })
    .AddJsonOptions(options =>
    {
        // Los enums viajan como texto: "Disponible" en lugar de 0.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Errores en formato ProblemDetails (RFC 9110) con el título de validación en español.
builder.Services.AddProblemDetails(options => options.CustomizeProblemDetails = context =>
{
    if (context.ProblemDetails is ValidationProblemDetails)
        context.ProblemDetails.Title = "Hay errores de validación";
});
builder.Services.AddOpenApi();

// ---------- CORS: sitios que pueden llamar a la API desde el navegador ----------
// Se configuran en appsettings.json (Cors:Origenes): Live Server de VS Code (puerto 5500) y Angular (4200).
var origenes = builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(CorsFrontend, policy => policy
    .WithOrigins(origenes)
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

// Crea la base de datos y carga las bodegas demo la primera vez.
using (var scope = app.Services.CreateScope())
{
    SeedData.Inicializar(scope.ServiceProvider.GetRequiredService<AppDbContext>());
}

if (app.Environment.IsDevelopment())
{
    // Documento OpenAPI: http://localhost:5080/openapi/v1.json (Postman lo puede importar).
    app.MapOpenApi();
}
else
{
    app.UseExceptionHandler();
}

app.UseStatusCodePages();
app.UseCors(CorsFrontend);
app.MapControllers();

// Página de bienvenida: útil como primera petición en Postman.
app.MapGet("/", () => Results.Ok(new
{
    api = "Bodegas Seguras Zaachila",
    version = "1.1",
    openApi = "/openapi/v1.json",
    usuarios = new[]
    {
        "GET    /api/empresa",
        "GET    /api/bodegas?estado=Disponible",
        "GET    /api/bodegas/{id}",
        "POST   /api/solicitudes"
    },
    administracion = new[]
    {
        "GET    /api/admin/resumen",
        "GET    /api/admin/bodegas?estado=Ocupada",
        "GET    /api/admin/bodegas/{id}",
        "POST   /api/admin/bodegas",
        "PUT    /api/admin/bodegas/{id}",
        "DELETE /api/admin/bodegas/{id}",
        "GET    /api/admin/solicitudes?estado=Pendiente&bodegaId=1",
        "GET    /api/admin/solicitudes/{id}",
        "PATCH  /api/admin/solicitudes/{id}/estado",
        "DELETE /api/admin/solicitudes/{id}",
        "POST   /api/admin/demo/reset"
    }
})).ExcludeFromDescription();

app.Run();
