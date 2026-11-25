namespace BodegasZaachila.Api.Models;

/// <summary>Estados de seguimiento de una solicitud de cotización.</summary>
public enum EstadoSolicitud
{
    Pendiente,
    Contactado,
    Cerrado
}

/// <summary>Solicitud de cotización enviada desde el sitio público.</summary>
public class Solicitud
{
    public int Id { get; set; }
    public int BodegaId { get; set; }
    public Bodega? Bodega { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;

    public DateOnly Fecha { get; set; }
    public EstadoSolicitud Estado { get; set; } = EstadoSolicitud.Pendiente;
}
