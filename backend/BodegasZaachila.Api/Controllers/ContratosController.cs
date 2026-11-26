using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/contratos")]
[Authorize]
public class ContratosController(AppDbContext db) : ApiControllerBase
{
    /// <summary>Dueño: todos. Cliente: los suyos (con su código de acceso). Los más recientes primero.</summary>
    [HttpGet]
    public async Task<ActionResult<List<ContratoDto>>> Listar(CancellationToken ct)
    {
        var query = db.Contratos.AsNoTracking().Include(c => c.Cliente).AsQueryable();
        if (!EsDueno)
            query = query.Where(c => c.ClienteId == UsuarioId);

        var contratos = await query.OrderByDescending(c => c.Inicio).ToListAsync(ct);
        return contratos.Select(c => c.ToDto()).ToList();
    }

    /// <summary>El cliente recibe su bodega: Reservado → Activo y la bodega pasa a Ocupada.</summary>
    [HttpPost("{id}/activar")]
    [Authorize(Roles = Roles.Dueno)]
    [ProducesResponseType<ContratoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Activar(string id, CancellationToken ct)
    {
        var contrato = await db.Contratos.Include(c => c.Cliente).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (contrato is null)
            return NoExiste("El contrato no existe.");
        if (contrato.Estado != EstadoContrato.Reservado)
            return Conflicto("Solo un contrato reservado se puede activar.");

        var bodega = await db.Bodegas.FirstAsync(b => b.Id == contrato.BodegaId, ct);
        contrato.Estado = EstadoContrato.Activo;
        bodega.Estado = EstadoBodega.Ocupada;
        bodega.ClienteId = contrato.ClienteId;
        await db.SaveChangesAsync(ct);

        return Ok(contrato.ToDto());
    }

    /// <summary>Termina el contrato. Si la bodega era de ese cliente, vuelve a Disponible sin cliente.</summary>
    [HttpPost("{id}/finalizar")]
    [Authorize(Roles = Roles.Dueno)]
    [ProducesResponseType<ContratoDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Finalizar(string id, CancellationToken ct)
    {
        var contrato = await db.Contratos.Include(c => c.Cliente).FirstOrDefaultAsync(c => c.Id == id, ct);
        if (contrato is null)
            return NoExiste("El contrato no existe.");
        if (contrato.Estado == EstadoContrato.Finalizado)
            return Conflicto("El contrato ya está finalizado.");

        var bodega = await db.Bodegas.FirstAsync(b => b.Id == contrato.BodegaId, ct);
        contrato.Estado = EstadoContrato.Finalizado;
        if (bodega.ClienteId == contrato.ClienteId)
        {
            bodega.Estado = EstadoBodega.Disponible;
            bodega.ClienteId = null;
        }
        await db.SaveChangesAsync(ct);

        return Ok(contrato.ToDto());
    }
}
