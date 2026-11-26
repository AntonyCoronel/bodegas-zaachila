using BodegasZaachila.Api.Dtos;
using BodegasZaachila.Api.Models;

namespace BodegasZaachila.Api.Servicios;

/// <summary>Convierte entidades a lo que ve cada quien, aplicando las reglas de privacidad de API.md.</summary>
public static class Vistas
{
    public static UsuarioDto ToDto(this Usuario u) => new(u.Id, u.Nombre, u.Correo, u.Telefono, u.Rol);

    public static ClienteDto ToClienteDto(this Usuario u) => new(u.Id, u.Nombre, u.Correo, u.Telefono, u.Rol, u.RegistradoEn);

    /// <summary>
    /// El cliente asignado solo lo ve el dueño, o el cliente si la bodega es suya.
    /// Sin sesión o para otros clientes, clienteId y clienteNombre van en null.
    /// La bodega debe venir con Include(b => b.Cliente).
    /// </summary>
    public static BodegaDto ToDto(this Bodega b, string? usuarioId, bool esDueno)
    {
        var puedeVer = esDueno || (usuarioId is not null && b.ClienteId == usuarioId);
        return new BodegaDto(
            b.Id, b.Slug, b.Titulo, b.Dimensiones, b.Ancho, b.Fondo, b.M2, b.Precio, b.Estado,
            puedeVer ? b.ClienteId : null,
            puedeVer ? b.Cliente?.Nombre : null,
            b.Descripcion, b.Usos, b.Detalles);
    }

    /// <summary>La solicitud debe venir con Include(s => s.Cliente).</summary>
    public static SolicitudDto ToDto(this Solicitud s) => new(
        s.Id, s.ClienteId,
        s.Cliente?.Nombre ?? string.Empty, s.Cliente?.Telefono ?? string.Empty, s.Cliente?.Correo ?? string.Empty,
        s.BodegaId, s.FechaInicio, s.Meses, s.Mensaje, s.Estado, s.Respuesta, s.CreadaEn);

    /// <summary>El contrato debe venir con Include(c => c.Cliente).</summary>
    public static ContratoDto ToDto(this Contrato c) => new(
        c.Id, c.ClienteId, c.Cliente?.Nombre ?? string.Empty, c.BodegaId,
        c.Inicio, c.Fin, c.Meses, c.PrecioMensual, c.Estado, c.CodigoAcceso);

    /// <summary>
    /// El pago debe venir con Include(p => p.Contrato).ThenInclude(c => c.Cliente).
    /// "Vencido" = pendiente con fecha de vencimiento anterior a hoy.
    /// </summary>
    public static PagoDto ToDto(this Pago p, DateOnly hoy)
    {
        var estado = p.Estado == EstadoPago.Pendiente && p.Vence < hoy ? EstadoPago.Vencido : p.Estado;
        return new PagoDto(
            p.Id, p.Folio, p.ContratoId,
            p.Contrato?.ClienteId ?? string.Empty, p.Contrato?.Cliente?.Nombre ?? string.Empty, p.Contrato?.BodegaId ?? string.Empty,
            p.Concepto, p.Periodo, p.Monto, p.Vence, estado, p.PagadoEn, p.Metodo);
    }
}
