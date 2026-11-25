using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Admin;

/// <summary>Seguimiento de las solicitudes de cotización que envían los usuarios.</summary>
[ApiController]
[Route("api/admin/solicitudes")]
[Tags("Administración")]
[Produces("application/json")]
public class AdminSolicitudesController(AppDbContext db) : ControllerBase
{
    /// <summary>Lista las solicitudes, la más reciente primero. Filtros opcionales: ?estado=Pendiente&amp;bodegaId=1</summary>
    [HttpGet]
    public async Task<ActionResult<List<SolicitudDto>>> GetAll(
        [FromQuery] string? estado,
        [FromQuery] int? bodegaId,
        CancellationToken ct)
    {
        var query = db.Solicitudes.AsNoTracking().Include(s => s.Bodega).AsQueryable();

        if (!string.IsNullOrWhiteSpace(estado))
        {
            if (!Estados.TryParse<EstadoSolicitud>(estado, out var filtro))
            {
                ModelState.AddModelError("estado", "Estado inválido. Usa Pendiente, Contactado o Cerrado");
                return ValidationProblem(ModelState);
            }
            query = query.Where(s => s.Estado == filtro);
        }

        if (bodegaId is not null)
            query = query.Where(s => s.BodegaId == bodegaId);

        var solicitudes = await query.OrderByDescending(s => s.Id).ToListAsync(ct);
        return solicitudes.Select(s => s.ToDto()).ToList();
    }

    /// <summary>Detalle de una solicitud.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<SolicitudDto>> GetById(int id, CancellationToken ct)
    {
        var solicitud = await db.Solicitudes.AsNoTracking().Include(s => s.Bodega)
            .FirstOrDefaultAsync(s => s.Id == id, ct);
        return solicitud is null ? NoEncontrada(id) : solicitud.ToDto();
    }

    /// <summary>Cambia el estado de seguimiento: Pendiente, Contactado o Cerrado.</summary>
    [HttpPatch("{id:int}/estado")]
    public async Task<ActionResult<SolicitudDto>> UpdateEstado(int id, SolicitudEstadoDto dto, CancellationToken ct)
    {
        var solicitud = await db.Solicitudes.Include(s => s.Bodega).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (solicitud is null)
            return NoEncontrada(id);

        solicitud.Estado = dto.ObtenerEstado();
        await db.SaveChangesAsync(ct);
        return solicitud.ToDto();
    }

    /// <summary>Elimina una solicitud.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var borradas = await db.Solicitudes.Where(s => s.Id == id).ExecuteDeleteAsync(ct);
        return borradas == 0 ? NoEncontrada(id) : NoContent();
    }

    private ObjectResult NoEncontrada(int id) => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Solicitud no encontrada",
        detail: $"No existe una solicitud con id {id}.");
}
