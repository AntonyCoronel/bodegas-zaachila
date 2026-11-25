namespace BodegasZaachila.Api.Models;

/// <summary>Estados posibles de una bodega (igual que en el prototipo original).</summary>
public enum EstadoBodega
{
    Disponible,
    Reservada,
    Ocupada
}

/// <summary>Cliente asignado a una bodega reservada u ocupada.</summary>
public class Cliente
{
    public string Nombre { get; set; } = string.Empty;
    public string? Telefono { get; set; }
    public string? Correo { get; set; }
}

/// <summary>Unidad de almacenamiento en renta.</summary>
public class Bodega
{
    public int Id { get; set; }
    public string Codigo { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;

    /// <summary>Volumen en metros cúbicos.</summary>
    public double Volumen { get; set; }

    /// <summary>Precio mensual en MXN.</summary>
    public decimal Precio { get; set; }

    public EstadoBodega Estado { get; set; } = EstadoBodega.Disponible;

    /// <summary>Solo existe cuando la bodega está Reservada u Ocupada.</summary>
    public Cliente? Cliente { get; set; }

    public string Imagen { get; set; } = string.Empty;
    public string Etiqueta { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string Capacidad { get; set; } = string.Empty;
    public string Dimensiones { get; set; } = string.Empty;
    public string Acceso { get; set; } = string.Empty;

    public List<string> Contenido { get; set; } = [];
    public List<string> Caracteristicas { get; set; } = [];

    public List<Solicitud> Solicitudes { get; set; } = [];
}
