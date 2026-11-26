using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers;

[Route("api/clientes")]
[Authorize(Roles = Roles.Dueno)]
public class ClientesController(AppDbContext db) : ApiControllerBase
{
    /// <summary>Lista de clientes registrados (solo el dueño).</summary>
    [HttpGet]
    public async Task<ActionResult<List<ClienteDto>>> Listar(CancellationToken ct)
    {
        var clientes = await db.Usuarios.AsNoTracking()
            .Where(u => u.Rol == Rol.Cliente)
            .OrderBy(u => u.Nombre)
            .ToListAsync(ct);
        return clientes.Select(u => u.ToClienteDto()).ToList();
    }
}
