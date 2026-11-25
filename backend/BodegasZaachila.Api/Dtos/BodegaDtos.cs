using System.ComponentModel.DataAnnotations;
using BodegasZaachila.Api.Models;

namespace BodegasZaachila.Api.Dtos;

public record ClienteDto(string Nombre, string? Telefono, string? Correo);

/// <summary>
/// Bodega para la parte de usuarios (catálogo y detalle).
/// No incluye el cliente asignado: esos datos solo se ven en administración.
/// </summary>
public record BodegaDto(
    int Id,
    string Codigo,
    string Nombre,
    string Slug,
    double Volumen,
    decimal Precio,
    EstadoBodega Estado,
    string Imagen,
    string Etiqueta,
    string Descripcion,
    string Capacidad,
    string Dimensiones,
    string Acceso,
    List<string> Contenido,
    List<string> Caracteristicas,
    string DisponibleDesde);

/// <summary>Bodega para administración: los mismos datos más el cliente asignado.</summary>
public record BodegaAdminDto(
    int Id,
    string Codigo,
    string Nombre,
    string Slug,
    double Volumen,
    decimal Precio,
    EstadoBodega Estado,
    ClienteDto? Cliente,
    string Imagen,
    string Etiqueta,
    string Descripcion,
    string Capacidad,
    string Dimensiones,
    string Acceso,
    List<string> Contenido,
    List<string> Caracteristicas,
    string DisponibleDesde);

/// <summary>Cliente que llega en el cuerpo de POST/PUT de bodegas.</summary>
public class ClienteInputDto
{
    [StringLength(90, ErrorMessage = "El nombre del cliente admite máximo 90 caracteres")]
    public string? Nombre { get; set; }

    [StringLength(25, ErrorMessage = "El teléfono del cliente admite máximo 25 caracteres")]
    public string? Telefono { get; set; }

    [EmailAddress(ErrorMessage = "El correo del cliente no es válido")]
    [StringLength(100, ErrorMessage = "El correo del cliente admite máximo 100 caracteres")]
    public string? Correo { get; set; }
}

/// <summary>
/// Cuerpo para crear (POST) o editar (PUT) una bodega desde administración.
/// Aplica las mismas reglas que updateBodega() del prototipo.
/// </summary>
public class BodegaUpsertDto : IValidatableObject
{
    /// <summary>Opcional. Si no se envía al crear, se genera (BOD-005, BOD-006...).</summary>
    [StringLength(20, ErrorMessage = "El código admite máximo 20 caracteres")]
    public string? Codigo { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(80, ErrorMessage = "El nombre admite máximo 80 caracteres")]
    public string? Nombre { get; set; }

    [Range(0.01, 100000, ErrorMessage = "El volumen debe ser mayor que 0")]
    public double Volumen { get; set; }

    [Range(typeof(decimal), "0", "1000000", ErrorMessage = "El precio no puede ser negativo")]
    public decimal Precio { get; set; }

    /// <summary>Disponible, Reservada u Ocupada.</summary>
    [Required(ErrorMessage = "El estado es obligatorio")]
    public string? Estado { get; set; }

    /// <summary>Obligatorio cuando el estado es Reservada u Ocupada. Se ignora si está Disponible.</summary>
    public ClienteInputDto? Cliente { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria")]
    [StringLength(500, ErrorMessage = "La descripción admite máximo 500 caracteres")]
    public string? Descripcion { get; set; }

    // Campos opcionales: si no se envían, se conservan (PUT) o se usan valores por defecto (POST).
    public string? Slug { get; set; }
    public string? Imagen { get; set; }
    public string? Etiqueta { get; set; }
    public string? Capacidad { get; set; }
    public string? Dimensiones { get; set; }
    public string? Acceso { get; set; }
    public List<string>? Contenido { get; set; }
    public List<string>? Caracteristicas { get; set; }

    /// <summary>Estado ya validado convertido a enum (usar solo después de la validación).</summary>
    public EstadoBodega ObtenerEstado() => Estados.Parse<EstadoBodega>(Estado!);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Estado))
            yield break; // ya lo reporta [Required]

        if (!Estados.TryParse<EstadoBodega>(Estado, out var estado))
        {
            yield return new ValidationResult(
                "Estado inválido. Usa Disponible, Reservada u Ocupada",
                ["estado"]);
            yield break;
        }

        if (estado != EstadoBodega.Disponible && string.IsNullOrWhiteSpace(Cliente?.Nombre))
        {
            yield return new ValidationResult(
                "Asigna un cliente a la bodega reservada u ocupada",
                ["cliente"]);
        }
    }
}
