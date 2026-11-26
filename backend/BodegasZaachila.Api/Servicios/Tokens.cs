using System.Security.Claims;
using System.Text;
using BodegasZaachila.Api.Models;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace BodegasZaachila.Api.Servicios;

/// <summary>Configuración del token (sección "Jwt" de appsettings).</summary>
public class JwtOpciones
{
    public const string Seccion = "Jwt";

    public string Emisor { get; set; } = "BodegaSeguraZaachila";
    /// <summary>Clave para firmar (mínimo 32 caracteres). Si falta, se genera una al azar al arrancar.</summary>
    public string? Clave { get; set; }
    public int HorasDeValidez { get; set; } = 168;

    public SymmetricSecurityKey LlaveDeFirma() => new(Encoding.UTF8.GetBytes(Clave!));
}

/// <summary>Emite el token que la app manda como "Authorization: Bearer ...".</summary>
public class Tokens(JwtOpciones opciones)
{
    public const string ClaimRol = "rol";
    public const string ClaimId = "sub";

    public string Emitir(Usuario usuario)
    {
        var descriptor = new SecurityTokenDescriptor
        {
            Issuer = opciones.Emisor,
            Audience = opciones.Emisor,
            Expires = DateTime.UtcNow.AddHours(opciones.HorasDeValidez),
            Subject = new ClaimsIdentity(
            [
                new Claim(ClaimId, usuario.Id),
                new Claim(ClaimRol, Roles.Texto(usuario.Rol)),
                new Claim("nombre", usuario.Nombre)
            ]),
            SigningCredentials = new SigningCredentials(opciones.LlaveDeFirma(), SecurityAlgorithms.HmacSha256)
        };
        return new JsonWebTokenHandler().CreateToken(descriptor);
    }
}
