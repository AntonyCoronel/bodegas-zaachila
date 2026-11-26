using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BodegasZaachila.Api.Controllers;

/// <summary>
/// Botón «Restaurar datos de ejemplo» del panel del dueño. API.md dice que el backend real no la necesita;
/// se deja para la demostración y para que la colección de Postman siempre empiece igual.
/// </summary>
[Route("api/demo")]
[Authorize(Roles = Roles.Dueno)]
public class DemoController(AppDbContext db, IPasswordHasher<Usuario> hasher) : ApiControllerBase
{
    [HttpPost("reiniciar")]
    public async Task<ActionResult<ReinicioDto>> Reiniciar(CancellationToken ct)
    {
        await DatosEjemplo.ReiniciarAsync(db, hasher, ct);
        return new ReinicioDto(true);
    }
}
