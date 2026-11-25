using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Controllers.Admin;

/// <summary>
/// Administración de bodegas (bodegas_zaachila/dashboard.html):
/// precio, volumen, estado y cliente asignado.
/// </summary>
[ApiController]
[Route("api/admin/bodegas")]
[Tags("Administración")]
[Produces("application/json")]
public partial class AdminBodegasController(AppDbContext db) : ControllerBase
{
    private const string ImagenPorDefecto = "assets/images/bodega-mini.png";

    /// <summary>Lista todas las bodegas con su cliente. Filtro opcional: ?estado=Ocupada</summary>
    [HttpGet]
    public async Task<ActionResult<List<BodegaAdminDto>>> GetAll([FromQuery] string? estado, CancellationToken ct)
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
        return bodegas.Select(b => b.ToAdminDto()).ToList();
    }

    /// <summary>Detalle de una bodega con su cliente.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<BodegaAdminDto>> GetById(int id, CancellationToken ct)
    {
        var bodega = await db.Bodegas.AsNoTracking().FirstOrDefaultAsync(b => b.Id == id, ct);
        return bodega is null ? NoEncontrada(id) : bodega.ToAdminDto();
    }

    /// <summary>Crea una bodega nueva.</summary>
    [HttpPost]
    public async Task<ActionResult<BodegaAdminDto>> Create(BodegaUpsertDto dto, CancellationToken ct)
    {
        var codigo = string.IsNullOrWhiteSpace(dto.Codigo)
            ? await SiguienteCodigoAsync(ct)
            : dto.Codigo.Trim().ToUpperInvariant();

        if (await db.Bodegas.AnyAsync(b => b.Codigo == codigo, ct))
            return CodigoDuplicado(codigo);

        var bodega = new Bodega { Codigo = codigo };
        Aplicar(bodega, dto, esNueva: true);

        db.Bodegas.Add(bodega);
        await db.SaveChangesAsync(ct);

        return CreatedAtAction(nameof(GetById), new { id = bodega.Id }, bodega.ToAdminDto());
    }

    /// <summary>Edita una bodega (nombre, volumen, precio, estado, cliente, descripción...).</summary>
    [HttpPut("{id:int}")]
    public async Task<ActionResult<BodegaAdminDto>> Update(int id, BodegaUpsertDto dto, CancellationToken ct)
    {
        var bodega = await db.Bodegas.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (bodega is null)
            return NoEncontrada(id);

        if (!string.IsNullOrWhiteSpace(dto.Codigo))
        {
            var codigo = dto.Codigo.Trim().ToUpperInvariant();
            if (await db.Bodegas.AnyAsync(b => b.Codigo == codigo && b.Id != id, ct))
                return CodigoDuplicado(codigo);
            bodega.Codigo = codigo;
        }

        Aplicar(bodega, dto, esNueva: false);
        await db.SaveChangesAsync(ct);

        return bodega.ToAdminDto();
    }

    /// <summary>Elimina una bodega. No se permite si tiene solicitudes registradas.</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var bodega = await db.Bodegas.FirstOrDefaultAsync(b => b.Id == id, ct);
        if (bodega is null)
            return NoEncontrada(id);

        if (await db.Solicitudes.AnyAsync(s => s.BodegaId == id, ct))
        {
            return Problem(
                statusCode: StatusCodes.Status409Conflict,
                title: "No se puede eliminar la bodega",
                detail: $"La bodega {bodega.Codigo} tiene solicitudes registradas. Elimina primero sus solicitudes.");
        }

        db.Bodegas.Remove(bodega);
        await db.SaveChangesAsync(ct);
        return NoContent();
    }

    // ---------- utilidades ----------

    /// <summary>Copia los datos del DTO a la entidad aplicando las reglas del prototipo.</summary>
    private static void Aplicar(Bodega bodega, BodegaUpsertDto dto, bool esNueva)
    {
        bodega.Nombre = dto.Nombre!.Trim();
        bodega.Volumen = dto.Volumen;
        bodega.Precio = dto.Precio;
        bodega.Estado = dto.ObtenerEstado();
        bodega.Descripcion = dto.Descripcion!.Trim();

        // Regla: si está Disponible no tiene cliente; si está Reservada/Ocupada el cliente es obligatorio (validado en el DTO).
        bodega.Cliente = bodega.Estado == EstadoBodega.Disponible
            ? null
            : new Cliente
            {
                Nombre = dto.Cliente!.Nombre!.Trim(),
                Telefono = Limpio(dto.Cliente.Telefono),
                Correo = Limpio(dto.Cliente.Correo)
            };

        bodega.Slug = Limpio(dto.Slug) ?? (esNueva ? Slugify(bodega.Nombre) : bodega.Slug);
        bodega.Imagen = Limpio(dto.Imagen) ?? (esNueva ? ImagenPorDefecto : bodega.Imagen);
        bodega.Etiqueta = Limpio(dto.Etiqueta) ?? (esNueva ? string.Empty : bodega.Etiqueta);
        bodega.Capacidad = Limpio(dto.Capacidad) ?? (esNueva ? string.Empty : bodega.Capacidad);
        bodega.Dimensiones = Limpio(dto.Dimensiones) ?? (esNueva ? string.Empty : bodega.Dimensiones);
        bodega.Acceso = Limpio(dto.Acceso) ?? (esNueva ? string.Empty : bodega.Acceso);

        if (dto.Contenido is not null)
            bodega.Contenido = LimpiarLista(dto.Contenido);
        if (dto.Caracteristicas is not null)
            bodega.Caracteristicas = LimpiarLista(dto.Caracteristicas);
    }

    private async Task<string> SiguienteCodigoAsync(CancellationToken ct)
    {
        var codigos = await db.Bodegas.Select(b => b.Codigo).ToListAsync(ct);
        var maximo = codigos
            .Select(c => c.StartsWith("BOD-") && int.TryParse(c[4..], out var n) ? n : 0)
            .DefaultIfEmpty(0)
            .Max();
        return $"BOD-{maximo + 1:000}";
    }

    private ObjectResult NoEncontrada(int id) => Problem(
        statusCode: StatusCodes.Status404NotFound,
        title: "Bodega no encontrada",
        detail: $"No existe una bodega con id {id}.");

    private ObjectResult CodigoDuplicado(string codigo) => Problem(
        statusCode: StatusCodes.Status409Conflict,
        title: "Código duplicado",
        detail: $"Ya existe una bodega con el código {codigo}.");

    private static string? Limpio(string? texto) =>
        string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();

    private static List<string> LimpiarLista(IEnumerable<string> items) =>
        items.Where(i => !string.IsNullOrWhiteSpace(i)).Select(i => i.Trim()).ToList();

    private static string Slugify(string texto)
    {
        var sinAcentos = new string(texto.Normalize(NormalizationForm.FormD)
            .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
            .ToArray());
        return NoAlfanumerico().Replace(sinAcentos.ToLowerInvariant(), "-").Trim('-');
    }

    [GeneratedRegex("[^a-z0-9]+")]
    private static partial Regex NoAlfanumerico();
}
