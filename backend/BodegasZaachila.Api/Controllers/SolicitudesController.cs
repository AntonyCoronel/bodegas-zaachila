using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/solicitudes")]
[Authorize]
public class SolicitudesController(AppDbContext db) : ApiControllerBase
{
    /// <summary>Dueño: todas. Cliente: las suyas. Las más recientes primero.</summary>
    [HttpGet]
    public async Task<ActionResult<List<SolicitudDto>>> Listar(CancellationToken ct)
    {
        var query = db.Solicitudes.AsNoTracking().Include(s => s.Cliente).AsQueryable();
        if (!EsDueno)
            query = query.Where(s => s.ClienteId == UsuarioId);

        var solicitudes = await query.OrderByDescending(s => s.CreadaEn).ToListAsync(ct);
        return solicitudes.Select(s => s.ToDto()).ToList();
    }

    /// <summary>
    /// El cliente pide una bodega. La bodega debe estar Disponible, la fecha de inicio desde hoy,
    /// de 1 a 24 meses, y sin otra solicitud pendiente suya para la misma bodega.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = Roles.Cliente)]
    [ProducesResponseType<SolicitudDto>(StatusCodes.Status201Created)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear(NuevaSolicitudDto dto, CancellationToken ct)
    {
        var bodega = await db.Bodegas.FirstOrDefaultAsync(b => b.Id == dto.BodegaId, ct);
        if (bodega is null)
            return NoExiste("La bodega no existe.");
        if (bodega.Estado != EstadoBodega.Disponible)
            return Conflicto("Esta bodega ya no está disponible.");
        if (dto.Meses is null or < 1 or > 24)
            return Invalido("Elige de 1 a 24 meses.");
        if (!Fechas.TryDia(dto.FechaInicio, out var fechaInicio) || fechaInicio < Fechas.Hoy())
            return Invalido("Elige una fecha de inicio a partir de hoy.");

        var clienteId = UsuarioId!;
        if (await db.Solicitudes.AnyAsync(s => s.ClienteId == clienteId && s.BodegaId == bodega.Id && s.Estado == EstadoSolicitud.Pendiente, ct))
            return Conflicto("Ya tienes una solicitud pendiente para esta bodega.");

        var mensaje = (dto.Mensaje ?? string.Empty).Trim();
        var solicitud = new Solicitud
        {
            Id = await Negocio.SiguienteIdAsync(db, "SOL", ct),
            ClienteId = clienteId,
            BodegaId = bodega.Id,
            FechaInicio = fechaInicio,
            Meses = dto.Meses.Value,
            Mensaje = mensaje.Length > 500 ? mensaje[..500] : mensaje,
            Estado = EstadoSolicitud.Pendiente,
            CreadaEn = Fechas.Ahora()
        };
        db.Solicitudes.Add(solicitud);
        await db.SaveChangesAsync(ct);

        await db.Entry(solicitud).Reference(s => s.Cliente).LoadAsync(ct);
        return StatusCode(StatusCodes.Status201Created, solicitud.ToDto());
    }

    /// <summary>
    /// El dueño aprueba: se crea un contrato Reservado (precio actual, código al azar),
    /// la bodega pasa a Reservada con ese cliente y se genera el primer pago pendiente.
    /// </summary>
    [HttpPost("{id}/aprobar")]
    [Authorize(Roles = Roles.Dueno)]
    [ProducesResponseType<AprobacionDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Aprobar(string id, RespuestaDto? dto, CancellationToken ct)
    {
        var solicitud = await db.Solicitudes.Include(s => s.Cliente).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (solicitud is null)
            return NoExiste("La solicitud no existe.");
        if (solicitud.Estado != EstadoSolicitud.Pendiente)
            return Conflicto("Esta solicitud ya fue respondida.");

        var bodega = await db.Bodegas.FirstAsync(b => b.Id == solicitud.BodegaId, ct);
        if (bodega.Estado != EstadoBodega.Disponible)
            return Conflicto($"{bodega.Titulo} ya no está disponible. Rechaza la solicitud o libera la bodega primero.");

        var hoy = Fechas.Hoy();
        var inicio = solicitud.FechaInicio < hoy ? hoy : solicitud.FechaInicio;
        var contrato = await Negocio.CrearContratoAsync(db, solicitud.ClienteId, bodega, inicio, solicitud.Meses, EstadoContrato.Reservado, ct);

        bodega.Estado = EstadoBodega.Reservada;
        bodega.ClienteId = solicitud.ClienteId;
        solicitud.Estado = EstadoSolicitud.Aprobada;
        solicitud.Respuesta = Texto(dto?.Respuesta) ?? $"Aprobada. Tu bodega queda reservada a partir del {Fechas.Corta(inicio)}.";

        await db.SaveChangesAsync(ct);

        contrato.Cliente = solicitud.Cliente;
        return Ok(new AprobacionDto(solicitud.ToDto(), contrato.ToDto()));
    }

    /// <summary>El dueño rechaza. Si no manda respuesta se usa un texto amable.</summary>
    [HttpPost("{id}/rechazar")]
    [Authorize(Roles = Roles.Dueno)]
    [ProducesResponseType<RechazoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Rechazar(string id, RespuestaDto? dto, CancellationToken ct)
    {
        var solicitud = await db.Solicitudes.Include(s => s.Cliente).FirstOrDefaultAsync(s => s.Id == id, ct);
        if (solicitud is null)
            return NoExiste("La solicitud no existe.");
        if (solicitud.Estado != EstadoSolicitud.Pendiente)
            return Conflicto("Esta solicitud ya fue respondida.");

        solicitud.Estado = EstadoSolicitud.Rechazada;
        solicitud.Respuesta = Texto(dto?.Respuesta) ?? "Por ahora no podemos atender tu solicitud.";
        await db.SaveChangesAsync(ct);

        return Ok(new RechazoDto(solicitud.ToDto()));
    }

    private static string? Texto(string? valor)
    {
        var limpio = valor?.Trim();
        if (string.IsNullOrEmpty(limpio))
            return null;
        return limpio.Length > 500 ? limpio[..500] : limpio;
    }
}
