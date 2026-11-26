using System.Security.Cryptography;
using System.Text.Json.Serialization;
using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// ---------- Base de datos SQLite ----------
// La ruta relativa del .db se resuelve contra la carpeta del proyecto, así no importa desde dónde se ejecute.
var sqlite = new SqliteConnectionStringBuilder(builder.Configuration.GetConnectionString("Bodegas"));
if (!Path.IsPathRooted(sqlite.DataSource))
    sqlite.DataSource = Path.Combine(builder.Environment.ContentRootPath, sqlite.DataSource);
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(sqlite.ToString()));

// "Hoy" en la zona horaria del negocio (fechas de inicio, vencimientos, pagos).
Fechas.ConfigurarZona(builder.Configuration["ZonaHoraria"]);

// ---------- Sesión: contraseñas con hash y token JWT ----------
builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

var jwt = builder.Configuration.GetSection(JwtOpciones.Seccion).Get<JwtOpciones>() ?? new JwtOpciones();
var claveGenerada = string.IsNullOrWhiteSpace(jwt.Clave) || jwt.Clave.Length < 32;
if (claveGenerada)
    jwt.Clave = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)); // las sesiones se pierden al reiniciar
builder.Services.AddSingleton(jwt);
builder.Services.AddSingleton<Tokens>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Emisor,
            ValidAudience = jwt.Emisor,
            IssuerSigningKey = jwt.LlaveDeFirma(),
            NameClaimType = Tokens.ClaimId,
            RoleClaimType = Tokens.ClaimRol,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
        options.Events = new JwtBearerEvents
        {
            // El token sigue siendo válido solo si el usuario existe y conserva su rol
            // (por ejemplo, después de "Restaurar datos de ejemplo" una cuenta nueva ya no existe).
            OnTokenValidated = async context =>
            {
                var id = context.Principal?.FindFirst(Tokens.ClaimId)?.Value;
                var rol = context.Principal?.FindFirst(Tokens.ClaimRol)?.Value;
                var db = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                var usuario = id is null ? null : await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
                if (usuario is null || Roles.Texto(usuario.Rol) != rol)
                    context.Fail("La sesión ya no es válida.");
            }
        };
    });
builder.Services.AddAuthorization();

// ---------- Controladores y JSON ----------
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        // Los enums viajan como texto: "Disponible", "cliente", "Tarjeta"...
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // JSON mal formado o tipos incorrectos (por ejemplo "meses": "tres"): 400 con { "mensaje" }.
        options.InvalidModelStateResponseFactory = _ =>
            new BadRequestObjectResult(new ErrorDto("Revisa los datos enviados: alguno no tiene el formato correcto."));
    });

builder.Services.AddOpenApi();

// ---------- CORS ----------
// Con "npm start" Angular usa proxy.conf.json y no hace falta CORS.
// Sirve si la app llama a la API con la URL completa (baseUrl = 'http://localhost:3000/api').
var origenes = builder.Configuration.GetSection("Cors:Origenes").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddDefaultPolicy(policy => policy
    .WithOrigins(origenes)
    .AllowAnyHeader()
    .AllowAnyMethod()));

var app = builder.Build();

if (claveGenerada)
{
    app.Logger.LogWarning(
        "No hay Jwt:Clave configurada (mínimo 32 caracteres). Se generó una al azar: las sesiones se pierden al reiniciar la API.");
}

// Crea la base de datos y carga los datos de ejemplo la primera vez.
using (var scope = app.Services.CreateScope())
{
    DatosEjemplo.Inicializar(
        scope.ServiceProvider.GetRequiredService<AppDbContext>(),
        scope.ServiceProvider.GetRequiredService<IPasswordHasher<Usuario>>());
}

// Todos los errores salen como { "mensaje": "..." }, que es lo que muestra la app.
app.UseExceptionHandler(error => error.Run(async context =>
{
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new ErrorDto("Error inesperado del servidor."));
}));

app.UseStatusCodePages(async context =>
{
    var http = context.HttpContext;
    var mensaje = http.Response.StatusCode switch
    {
        StatusCodes.Status400BadRequest => "Revisa los datos enviados.",
        StatusCodes.Status401Unauthorized => "Inicia sesión para continuar.",
        StatusCodes.Status403Forbidden => "No tienes permiso para esta acción.",
        StatusCodes.Status404NotFound => $"Ruta no encontrada: {http.Request.Method} {http.Request.Path}",
        StatusCodes.Status405MethodNotAllowed => $"La ruta {http.Request.Path} no acepta {http.Request.Method}.",
        StatusCodes.Status415UnsupportedMediaType => "Envía los datos como JSON (Content-Type: application/json).",
        _ => "Error inesperado del servidor."
    };
    await http.Response.WriteAsJsonAsync(new ErrorDto(mensaje));
});

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment())
{
    // http://localhost:3000/openapi/v1.json (Postman lo puede importar).
    app.MapOpenApi();
}

app.MapControllers();

// Página de bienvenida: útil como primera petición en Postman.
app.MapGet("/", () => Results.Ok(new
{
    api = "Bodega Segura Zaachila",
    contrato = "bodega-angular/API.md (rama angular-dashboards)",
    cuentasDePrueba = new[] { "dueno@ejemplo.com / demo123", "maria@ejemplo.com / demo123" },
    publico = new[]
    {
        "POST /api/auth/login",
        "POST /api/auth/registro",
        "GET  /api/bodegas",
        "GET  /api/bodegas/{id}"
    },
    conSesion = new[]
    {
        "GET  /api/auth/yo",
        "GET  /api/solicitudes          (dueño: todas · cliente: las suyas)",
        "POST /api/solicitudes          (cliente)",
        "GET  /api/contratos            (dueño: todos · cliente: los suyos)",
        "GET  /api/pagos                (dueño: todos · cliente: los suyos)",
        "POST /api/pagos/{id}/pagar     (cliente dueño del pago, o dueño)"
    },
    soloDueno = new[]
    {
        "PATCH /api/bodegas/{id}",
        "POST  /api/solicitudes/{id}/aprobar",
        "POST  /api/solicitudes/{id}/rechazar",
        "POST  /api/contratos/{id}/activar",
        "POST  /api/contratos/{id}/finalizar",
        "GET   /api/clientes",
        "POST  /api/demo/reiniciar"
    }
})).ExcludeFromDescription();

app.Run();
