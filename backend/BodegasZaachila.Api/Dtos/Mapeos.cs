using BodegasZaachila.Api.Models;

namespace BodegasZaachila.Api.Dtos;

/// <summary>Conversión de entidades a DTOs.</summary>
public static class Mapeos
{
    /// <summary>Vista pública (usuarios): sin datos del cliente.</summary>
    public static BodegaDto ToDto(this Bodega b) => new(
        b.Id,
        b.Codigo,
        b.Nombre,
        b.Slug,
        b.Volumen,
        b.Precio,
        b.Estado,
        b.Imagen,
        b.Etiqueta,
        b.Descripcion,
        b.Capacidad,
        b.Dimensiones,
        b.Acceso,
        b.Contenido,
        b.Caracteristicas,
        DisponibleDesde(b));

    /// <summary>Vista de administración: incluye el cliente asignado.</summary>
    public static BodegaAdminDto ToAdminDto(this Bodega b) => new(
        b.Id,
        b.Codigo,
        b.Nombre,
        b.Slug,
        b.Volumen,
        b.Precio,
        b.Estado,
        b.Cliente is null ? null : new ClienteDto(b.Cliente.Nombre, b.Cliente.Telefono, b.Cliente.Correo),
        b.Imagen,
        b.Etiqueta,
        b.Descripcion,
        b.Capacidad,
        b.Dimensiones,
        b.Acceso,
        b.Contenido,
        b.Caracteristicas,
        DisponibleDesde(b));

    private static string DisponibleDesde(Bodega b) =>
        b.Estado == EstadoBodega.Disponible ? "Inmediata" : "No disponible";

    public static SolicitudDto ToDto(this Solicitud s) => new(
        s.Id,
        s.BodegaId,
        s.Bodega?.Codigo,
        s.Bodega?.Nombre,
        s.Nombre,
        s.Telefono,
        s.Correo,
        s.Mensaje,
        s.Fecha,
        s.Estado);
}
