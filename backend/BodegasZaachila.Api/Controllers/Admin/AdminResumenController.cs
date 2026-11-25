using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Admin;

/// <summary>Números de las tarjetas del dashboard (los mismos que calcula dashboard.js).</summary>
[ApiController]
[Route("api/admin/resumen")]
[Tags("Administración")]
[Produces("application/json")]
public class AdminResumenController(AppDbContext db) : ControllerBase
{
    /// <summary>Conteo de bodegas por estado, ingreso mensual de las ocupadas y solicitudes por estado.</summary>
    [HttpGet]
    public async Task<ActionResult<ResumenDto>> Get(CancellationToken ct)
    {
        var bodegas = await db.Bodegas.AsNoTracking()
            .Select(b => new { b.Estado, b.Precio })
            .ToListAsync(ct);
        var solicitudes = await db.Solicitudes.AsNoTracking()
            .Select(s => s.Estado)
            .ToListAsync(ct);

        return new ResumenDto(
            TotalBodegas: bodegas.Count,
            Disponibles: bodegas.Count(b => b.Estado == EstadoBodega.Disponible),
            Reservadas: bodegas.Count(b => b.Estado == EstadoBodega.Reservada),
            Ocupadas: bodegas.Count(b => b.Estado == EstadoBodega.Ocupada),
            IngresoMensualEstimado: bodegas.Where(b => b.Estado == EstadoBodega.Ocupada).Sum(b => b.Precio),
            TotalSolicitudes: solicitudes.Count,
            SolicitudesPendientes: solicitudes.Count(e => e == EstadoSolicitud.Pendiente),
            SolicitudesContactadas: solicitudes.Count(e => e == EstadoSolicitud.Contactado),
            SolicitudesCerradas: solicitudes.Count(e => e == EstadoSolicitud.Cerrado));
    }
}
