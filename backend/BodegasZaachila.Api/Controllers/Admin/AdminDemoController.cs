using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Admin;

[ApiController]
[Route("api/admin/demo")]
[Tags("Administración")]
[Produces("application/json")]
public class AdminDemoController(AppDbContext db) : ControllerBase
{
    /// <summary>Restaura las 4 bodegas de demostración y borra todas las solicitudes (botón "Restaurar demo").</summary>
    [HttpPost("reset")]
    public async Task<ActionResult<DemoRestauradaDto>> Reset(CancellationToken ct)
    {
        await SeedData.RestaurarAsync(db, ct);
        var bodegas = await db.Bodegas.AsNoTracking().OrderBy(b => b.Id).ToListAsync(ct);
        return new DemoRestauradaDto("Datos de demostración restaurados", bodegas.Select(b => b.ToAdminDto()).ToList());
    }
}
