using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Usuarios;

/// <summary>
/// Formulario "Solicita una cotización" de la parte de usuarios.
/// Los usuarios solo pueden enviar solicitudes; consultarlas y darles seguimiento es de administración.
/// </summary>
[ApiController]
[Route("api/solicitudes")]
[Tags("Usuarios")]
[Produces("application/json")]
public class SolicitudesController(AppDbContext db) : ControllerBase
{
    /// <summary>Registra una solicitud de cotización. Solo se aceptan bodegas Disponibles.</summary>
    [HttpPost]
    [ProducesResponseType<SolicitudDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(SolicitudCreateDto dto, CancellationToken ct)
    {
        var bodega = await db.Bodegas.FirstOrDefaultAsync(b => b.Id == dto.BodegaId, ct);
        if (bodega is null)
        {
            ModelState.AddModelError("bodegaId", $"No existe una bodega con id {dto.BodegaId}");
            return ValidationProblem(ModelState);
        }
        if (bodega.Estado != EstadoBodega.Disponible)
        {
            ModelState.AddModelError("bodegaId", $"Bodega no disponible para cotización (estado actual: {bodega.Estado})");
            return ValidationProblem(ModelState);
        }

        var solicitud = new Solicitud
        {
            BodegaId = bodega.Id,
            Bodega = bodega,
            Nombre = dto.Nombre!.Trim(),
            Telefono = dto.Telefono!.Trim(),
            Correo = dto.Correo!.Trim(),
            Mensaje = dto.Mensaje?.Trim() ?? string.Empty,
            Fecha = DateOnly.FromDateTime(DateTime.Now),
            Estado = EstadoSolicitud.Pendiente
        };

        db.Solicitudes.Add(solicitud);
        await db.SaveChangesAsync(ct);

        // La solicitud se consulta después desde administración.
        return Created($"/api/admin/solicitudes/{solicitud.Id}", solicitud.ToDto());
    }
}
