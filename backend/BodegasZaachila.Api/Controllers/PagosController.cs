using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/pagos")]
[Authorize]
public class PagosController(AppDbContext db) : ApiControllerBase
{
    /// <summary>Dueño: todos. Cliente: los de sus contratos. Ordenados por vencimiento, el más lejano primero.</summary>
    [HttpGet]
    public async Task<ActionResult<List<PagoDto>>> Listar(CancellationToken ct)
    {
        var query = db.Pagos.AsNoTracking().Include(p => p.Contrato).ThenInclude(c => c!.Cliente).AsQueryable();
        if (!EsDueno)
            query = query.Where(p => p.Contrato!.ClienteId == UsuarioId);

        var hoy = Fechas.Hoy();
        var pagos = await query.OrderByDescending(p => p.Vence).ThenByDescending(p => p.Folio).ToListAsync(ct);
        return pagos.Select(p => p.ToDto(hoy)).ToList();
    }

    /// <summary>
    /// Registra el pago (simulado). Lo puede hacer el cliente dueño del pago o el dueño (por ejemplo, efectivo).
    /// Si el contrato está Activo y aún no termina, se genera la mensualidad del mes siguiente (vence el día 10).
    /// </summary>
    [HttpPost("{id}/pagar")]
    [ProducesResponseType<PagoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Pagar(string id, PagarDto dto, CancellationToken ct)
    {
        var pago = await db.Pagos.Include(p => p.Contrato).ThenInclude(c => c!.Cliente).FirstOrDefaultAsync(p => p.Id == id, ct);
        if (pago is null)
            return NoExiste("El pago no existe.");

        var contrato = pago.Contrato!;
        if (!EsDueno && contrato.ClienteId != UsuarioId)
            return Prohibido("Este pago no es tuyo.");
        if (pago.Estado == EstadoPago.Pagado)
            return Conflicto("Este pago ya está liquidado.");
        if (!Enum.TryParse<MetodoPago>(dto.Metodo, ignoreCase: false, out var metodo) || !Enum.IsDefined(metodo) ||
            int.TryParse(dto.Metodo, out _))
        {
            return Invalido("Elige un método de pago.");
        }

        pago.Estado = EstadoPago.Pagado;
        pago.Metodo = metodo;
        pago.PagadoEn = Fechas.Ahora();

        // Siguiente mensualidad si el contrato sigue vigente.
        var siguienteInicio = Fechas.InicioDePeriodo(pago.Periodo).AddMonths(1);
        var siguiente = Fechas.Periodo(siguienteInicio);
        if (contrato.Estado == EstadoContrato.Activo && siguienteInicio < contrato.Fin &&
            !await db.Pagos.AnyAsync(p => p.ContratoId == contrato.Id && p.Periodo == siguiente, ct))
        {
            await Negocio.CrearPagoPendienteAsync(db, contrato, siguiente, siguienteInicio.AddDays(9), ct);
        }

        await db.SaveChangesAsync(ct);
        return Ok(pago.ToDto(Fechas.Hoy()));
    }
}
