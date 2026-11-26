using System.Text.Json.Serialization;

namespace BodegasZaachila.Api.Models;

// Entidades que se guardan en SQLite. Los nombres siguen API.md (rama angular-dashboards).

/// <summary>"cliente" renta una bodega; "dueno" administra todo.</summary>
public enum Rol
{
    [JsonStringEnumMemberName("cliente")] Cliente,
    [JsonStringEnumMemberName("dueno")] Dueno
}

public enum EstadoBodega { Disponible, Reservada, Ocupada }

public enum EstadoSolicitud { Pendiente, Aprobada, Rechazada }

public enum EstadoContrato { Reservado, Activo, Finalizado }

/// <summary>En la base solo se guarda Pendiente o Pagado. "Vencido" se calcula al responder.</summary>
public enum EstadoPago { Pendiente, Vencido, Pagado }

public enum MetodoPago { Tarjeta, Transferencia, Efectivo }

/// <summary>Nombres de rol tal como viajan en el token ([Authorize(Roles = Roles.Dueno)]).</summary>
public static class Roles
{
    public const string Cliente = "cliente";
    public const string Dueno = "dueno";

    public static string Texto(Rol rol) => rol == Rol.Dueno ? Dueno : Cliente;
}

public class Usuario
{
    public string Id { get; set; } = string.Empty;
    public string Nombre { get; set; } = string.Empty;
    /// <summary>Siempre en minúsculas y sin espacios.</summary>
    public string Correo { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public Rol Rol { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public DateOnly RegistradoEn { get; set; }
}

public class Bodega
{
    /// <summary>BOD-001, BOD-002...</summary>
    public string Id { get; set; } = string.Empty;
    /// <summary>pequeno, mediano, grande, extra-grande: el sitio usa el slug para fotos y páginas.</summary>
    public string Slug { get; set; } = string.Empty;
    public string Titulo { get; set; } = string.Empty;
    public string Dimensiones { get; set; } = string.Empty;
    /// <summary>Metros de frente (sobre el pasillo).</summary>
    public double Ancho { get; set; }
    /// <summary>Metros de fondo.</summary>
    public double Fondo { get; set; }
    public double M2 { get; set; }
    /// <summary>Pesos MXN por mes, entero.</summary>
    public int Precio { get; set; }
    public EstadoBodega Estado { get; set; }
    public string? ClienteId { get; set; }
    public Usuario? Cliente { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public List<string> Usos { get; set; } = [];
    public List<string> Detalles { get; set; } = [];
}

public class Solicitud
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public Usuario? Cliente { get; set; }
    public string BodegaId { get; set; } = string.Empty;
    public DateOnly FechaInicio { get; set; }
    public int Meses { get; set; }
    public string Mensaje { get; set; } = string.Empty;
    public EstadoSolicitud Estado { get; set; }
    public string? Respuesta { get; set; }
    public DateTime CreadaEn { get; set; }
}

public class Contrato
{
    public string Id { get; set; } = string.Empty;
    public string ClienteId { get; set; } = string.Empty;
    public Usuario? Cliente { get; set; }
    public string BodegaId { get; set; } = string.Empty;
    public DateOnly Inicio { get; set; }
    public DateOnly Fin { get; set; }
    public int Meses { get; set; }
    public int PrecioMensual { get; set; }
    public EstadoContrato Estado { get; set; }
    /// <summary>4 dígitos. Solo lo ven el cliente del contrato y el dueño.</summary>
    public string CodigoAcceso { get; set; } = string.Empty;
}

public class Pago
{
    public string Id { get; set; } = string.Empty;
    /// <summary>F-00001, F-00002...</summary>
    public string Folio { get; set; } = string.Empty;
    public string ContratoId { get; set; } = string.Empty;
    public Contrato? Contrato { get; set; }
    public string Concepto { get; set; } = string.Empty;
    /// <summary>Mes que cubre: AAAA-MM.</summary>
    public string Periodo { get; set; } = string.Empty;
    public int Monto { get; set; }
    public DateOnly Vence { get; set; }
    /// <summary>Pendiente o Pagado.</summary>
    public EstadoPago Estado { get; set; }
    public DateTime? PagadoEn { get; set; }
    public MetodoPago? Metodo { get; set; }
}

/// <summary>Contador para los ids nuevos (SOL-0101, CON-0102, u-0103...), igual que el backend simulado.</summary>
public class Secuencia
{
    public string Nombre { get; set; } = string.Empty;
    public int Valor { get; set; }
}
