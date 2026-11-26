using System.ComponentModel.DataAnnotations;
using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/auth")]
public class AuthController(AppDbContext db, IPasswordHasher<Usuario> hasher, Tokens tokens) : ApiControllerBase
{
    /// <summary>Inicia sesión. Devuelve el token y el usuario.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType<SesionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginDto dto, CancellationToken ct)
    {
        var correo = (dto.Correo ?? string.Empty).Trim().ToLowerInvariant();
        var usuario = await db.Usuarios.FirstOrDefaultAsync(u => u.Correo == correo, ct);

        if (usuario is null || string.IsNullOrEmpty(dto.Password) ||
            hasher.VerifyHashedPassword(usuario, usuario.PasswordHash, dto.Password) == PasswordVerificationResult.Failed)
        {
            return Error(StatusCodes.Status401Unauthorized, "Correo o contraseña incorrectos.");
        }

        return Ok(new SesionDto(tokens.Emitir(usuario), usuario.ToDto()));
    }

    /// <summary>Crea una cuenta de cliente y abre su sesión.</summary>
    [HttpPost("registro")]
    [AllowAnonymous]
    [ProducesResponseType<SesionDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Registro(RegistroDto dto, CancellationToken ct)
    {
        var nombre = (dto.Nombre ?? string.Empty).Trim();
        var correo = (dto.Correo ?? string.Empty).Trim().ToLowerInvariant();
        var telefono = (dto.Telefono ?? string.Empty).Trim();
        var password = dto.Password ?? string.Empty;

        if (nombre.Length == 0 || correo.Length == 0 || telefono.Length == 0)
            return Invalido("Completa nombre, correo y teléfono.");
        if (nombre.Length > 100 || telefono.Length > 30)
            return Invalido("El nombre o el teléfono son demasiado largos.");
        if (correo.Length > 120 || !new EmailAddressAttribute().IsValid(correo))
            return Invalido("Escribe un correo válido.");
        if (password.Length < 6)
            return Invalido("La contraseña debe tener al menos 6 caracteres.");
        if (await db.Usuarios.AnyAsync(u => u.Correo == correo, ct))
            return Conflicto("Ya existe una cuenta con ese correo.");

        var usuario = new Usuario
        {
            Id = await Negocio.SiguienteIdAsync(db, "u", ct),
            Nombre = nombre,
            Correo = correo,
            Telefono = telefono,
            Rol = Rol.Cliente,
            RegistradoEn = Fechas.Hoy()
        };
        usuario.PasswordHash = hasher.HashPassword(usuario, password);

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync(ct);

        return StatusCode(StatusCodes.Status201Created, new SesionDto(tokens.Emitir(usuario), usuario.ToDto()));
    }

    /// <summary>Usuario de la sesión actual.</summary>
    [HttpGet("yo")]
    [Authorize]
    [ProducesResponseType<UsuarioDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Yo(CancellationToken ct)
    {
        var usuario = await db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == UsuarioId, ct);
        return usuario is null
            ? Error(StatusCodes.Status401Unauthorized, "Inicia sesión para continuar.")
            : Ok(usuario.ToDto());
    }
}
