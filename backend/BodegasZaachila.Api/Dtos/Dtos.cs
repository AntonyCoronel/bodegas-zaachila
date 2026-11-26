using BodegasZaachila.Api.Models;

namespace BodegasZaachila.Api.Dtos;

// ---------- Respuestas (mismos nombres que bodega-angular/src/app/core/models.ts) ----------

/// <summary>Cuerpo de todos los errores. La app muestra "mensaje" tal cual al usuario.</summary>
public record ErrorDto(string Mensaje);

public record UsuarioDto(string Id, string Nombre, string Correo, string Telefono, Rol Rol);

public record ClienteDto(string Id, string Nombre, string Correo, string Telefono, Rol Rol, DateOnly RegistradoEn);

public record SesionDto(string Token, UsuarioDto Usuario);

public record BodegaDto(
    string Id,
    string Slug,
    string Titulo,
    string Dimensiones,
    double Ancho,
    double Fondo,
    double M2,
    int Precio,
    EstadoBodega Estado,
    string? ClienteId,
    string? ClienteNombre,
    string Descripcion,
    List<string> Usos,
    List<string> Detalles);

public record SolicitudDto(
    string Id,
    string ClienteId,
    string ClienteNombre,
    string ClienteTelefono,
    string ClienteCorreo,
    string BodegaId,
    DateOnly FechaInicio,
    int Meses,
    string Mensaje,
    EstadoSolicitud Estado,
    string? Respuesta,
    DateTime CreadaEn);

public record ContratoDto(
    string Id,
    string ClienteId,
    string ClienteNombre,
    string BodegaId,
    DateOnly Inicio,
    DateOnly Fin,
    int Meses,
    int PrecioMensual,
    EstadoContrato Estado,
    string CodigoAcceso);

public record PagoDto(
    string Id,
    string Folio,
    string ContratoId,
    string ClienteId,
    string ClienteNombre,
    string BodegaId,
    string Concepto,
    string Periodo,
    int Monto,
    DateOnly Vence,
    EstadoPago Estado,
    DateTime? PagadoEn,
    MetodoPago? Metodo);

public record AprobacionDto(SolicitudDto Solicitud, ContratoDto Contrato);

public record RechazoDto(SolicitudDto Solicitud);

public record ReinicioDto(bool Ok);

// ---------- Cuerpos de las peticiones ----------
// Todo es opcional a nivel de tipo: los controladores validan y responden con mensajes en español.

public record LoginDto(string? Correo, string? Password);

public record RegistroDto(string? Nombre, string? Correo, string? Telefono, string? Password);

/// <summary>PATCH /api/bodegas/{id}: solo se aplica lo que venga.</summary>
public record CambiosBodegaDto(decimal? Precio, string? Estado, string? ClienteId);

public record NuevaSolicitudDto(string? BodegaId, string? FechaInicio, int? Meses, string? Mensaje);

public record RespuestaDto(string? Respuesta);

public record PagarDto(string? Metodo);
