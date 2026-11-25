using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Usuarios;

/// <summary>
/// Catálogo para usuarios (bodegas_zaachila/index.html y bodega.html).
/// Solo lectura y sin datos de clientes.
/// </summary>
[ApiController]
[Route("api/bodegas")]
[Tags("Usuarios")]
[Produces("application/json")]
public class BodegasController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista las bodegas del catálogo. Filtro opcional: ?estado=Disponible</summary>
    [HttpGet]
    public async Task<ActionResult<List<BodegaDto>>> GetAll([FromQuery] string? estado, CancellationToken ct)
    {
        var query = db.Bodegas.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Estados.TryParse<EstadoBodega>(estado, out var filtro))
            {
                ModelState.AddModelError("estado", "Estado inválido. Usa Disponible, Reservada u Ocupada");
                return ValidationProblem(ModelState);
            }
            query = query.Where(b => b.Estado == filtro);
        }

        var bodegas = await query.OrderBy(b => b.Id).ToListAsync(ct);
        return bodegas.Select(b => b.ToDto()).ToList();
    }

    /// <summary>Ficha de una bodega.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BodegaDto>> GetById(int id, CancellationToken ct)
    {
        var bodega = await db.Bodegas.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, ct);
        return bodega is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "Bodega no encontrada",
                detail: $"No existe una bodega con id {id}.")
            : bodega.ToDto();
    }
}
