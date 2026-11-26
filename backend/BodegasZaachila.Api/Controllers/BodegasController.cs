using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/bodegas")]
public class BodegasController(AppDbContext db) : ApiControllerBase
{
    /// <summary>
    /// Las 4 bodegas. Es pública: sin sesión no trae datos del cliente.
    /// Con sesión de dueño trae el cliente de cada bodega; un cliente solo ve el suyo.
    /// </summary>
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<List<BodegaDto>>> Listar(CancellationToken ct)
    {
        var bodegas = await db.Bodegas.AsNoTracking().Include(b => b.Cliente).OrderBy(b => b.Id).ToListAsync(ct);
        return bodegas.Select(b => b.ToDto(UsuarioId, EsDueno)).ToList();
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    [ProducesResponseType<BodegaDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obtener(string id, CancellationToken ct)
    {
        var bodega = await db.Bodegas.AsNoTracking().Include(b => b.Cliente).FirstOrDefaultAsync(b => b.Id == id, ct);
        return bodega is null ? NoExiste("La bodega no existe.") : Ok(bodega.ToDto(UsuarioId, EsDueno));
    }

    /// <summary>
    /// El dueño cambia precio, estado y cliente. Reglas:
    /// Disponible finaliza el contrato vigente y quita el cliente;
    /// Reservada u Ocupada exigen un cliente: si es el mismo del contrato vigente solo cambia el estado del contrato,
    /// si es otro se finaliza el anterior y se crea un contrato de 1 mes desde hoy con su primer pago.
    /// </summary>
    [HttpPatch("{id}")]
    [Authorize(Roles = Roles.Dueno)]
    [ProducesResponseType<BodegaDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ErrorDto>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Editar(string id, CambiosBodegaDto dto, CancellationToken ct)
    {
        var bodega = await db.Bodegas.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (bodega is null)
            return NoExiste("La bodega no existe.");

        if (dto.Precio is not null)
        {
            if (dto.Precio <= 0 || dto.Precio > 1_000_000)
                return Invalido("Introduce un precio válido.");
            bodega.Precio = (int)Math.Round(dto.Precio.Value, MidpointRounding.AwayFromZero);
        }

        if (dto.Estado is not null)
        {
            if (!Enum.TryParse<EstadoBodega>(dto.Estado, ignoreCase: false, out var estado) || !Enum.IsDefined(estado) ||
                int.TryParse(dto.Estado, out _))
            {
                return Invalido("Estado no válido.");
            }

            var vigente = await Negocio.ContratoVigenteAsync(db, bodega.Id, ct);
            if (estado == EstadoBodega.Disponible)
            {
                if (vigente is not null)
                    vigente.Estado = EstadoContrato.Finalizado;
                bodega.ClienteId = null;
            }
            else
            {
                var clienteId = dto.ClienteId ?? bodega.ClienteId ?? string.Empty;
                var cliente = await db.Usuarios.FirstOrDefaultAsync(u => u.Id == clienteId && u.Rol == Rol.Cliente, ct);
                if (cliente is null)
                    return Invalido("Asigna un cliente para reservar u ocupar la bodega.");

                var estadoContrato = estado == EstadoBodega.Ocupada ? EstadoContrato.Activo : EstadoContrato.Reservado;
                if (vigente is not null && vigente.ClienteId == cliente.Id)
                {
                    vigente.Estado = estadoContrato;
                }
                else
                {
                    if (vigente is not null)
                        vigente.Estado = EstadoContrato.Finalizado;
                    await Negocio.CrearContratoAsync(db, cliente.Id, bodega, Fechas.Hoy(), 1, estadoContrato, ct);
                }
                bodega.ClienteId = cliente.Id;
            }
            bodega.Estado = estado;
        }

        await db.SaveChangesAsync(ct);

        await db.Entry(bodega).Reference(b => b.Cliente).LoadAsync(ct);
        return Ok(bodega.ToDto(UsuarioId, EsDueno));
    }
}
