using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Mvc;

namespace BodegasZaachila.Api.Controllers;

/// <summary>Base de los controladores: datos de la sesión y errores con el formato { "mensaje": "..." }.</summary>
[ApiController]
[Produces("application/json")]
public abstract class ApiControllerBase : ControllerBase
{
    /// <summary>Id del usuario del token, o null si no hay sesión.</summary>
    protected string? UsuarioId => User.FindFirst(Tokens.ClaimId)?.Value;

    protected bool EsDueno => User.IsInRole(Roles.Dueno);

    protected ObjectResult Error(int status, string mensaje) =>
        new(new ErrorDto(mensaje)) { StatusCode = status };

    protected ObjectResult Invalido(string mensaje) => Error(StatusCodes.Status400BadRequest, mensaje);
    protected ObjectResult Prohibido(string mensaje) => Error(StatusCodes.Status403Forbidden, mensaje);
    protected ObjectResult NoExiste(string mensaje) => Error(StatusCodes.Status404NotFound, mensaje);
    protected ObjectResult Conflicto(string mensaje) => Error(StatusCodes.Status409Conflict, mensaje);
}
