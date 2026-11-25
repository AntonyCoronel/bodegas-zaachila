using System.ComponentModel.DataAnnotations;
using BodegasZaachila.Api.Models;

namespace BodegasZaachila.Api.Dtos;

/// <summary>Solicitud tal como la devuelve la API (incluye código y nombre de la bodega).</summary>
public record SolicitudDto(
    int Id,
    int BodegaId,
    string? BodegaCodigo,
    string? BodegaNombre,
    string Nombre,
    string Telefono,
    string Correo,
    string Mensaje,
    DateOnly Fecha,
    EstadoSolicitud Estado);

/// <summary>Cuerpo de POST /api/solicitudes (formulario "Solicita una cotización").</summary>
public class SolicitudCreateDto
{
    [Required(ErrorMessage = "Selecciona una bodega")]
    public int? BodegaId { get; set; }

    [Required(ErrorMessage = "El nombre es obligatorio")]
    [StringLength(90, ErrorMessage = "El nombre admite máximo 90 caracteres")]
    public string? Nombre { get; set; }

    [Required(ErrorMessage = "El teléfono es obligatorio")]
    [StringLength(25, ErrorMessage = "El teléfono admite máximo 25 caracteres")]
    public string? Telefono { get; set; }

    [Required(ErrorMessage = "El correo es obligatorio")]
    [EmailAddress(ErrorMessage = "El correo no es válido")]
    [StringLength(100, ErrorMessage = "El correo admite máximo 100 caracteres")]
    public string? Correo { get; set; }

    [StringLength(1000, ErrorMessage = "El mensaje admite máximo 1000 caracteres")]
    public string? Mensaje { get; set; }
}

/// <summary>Cuerpo de PATCH /api/solicitudes/{id}/estado.</summary>
public class SolicitudEstadoDto : IValidatableObject
{
    /// <summary>Pendiente, Contactado o Cerrado.</summary>
    [Required(ErrorMessage = "El estado es obligatorio")]
    public string? Estado { get; set; }

    /// <summary>Estado ya validado convertido a enum (usar solo después de la validación).</summary>
    public EstadoSolicitud ObtenerEstado() => Estados.Parse<EstadoSolicitud>(Estado!);

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Estado))
            yield break;

        if (!Estados.TryParse<EstadoSolicitud>(Estado, out _))
        {
            yield return new ValidationResult(
                "Estado inválido. Usa Pendiente, Contactado o Cerrado",
                ["estado"]);
        }
    }
}
