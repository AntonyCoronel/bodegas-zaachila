namespace BodegasZaachila.Api.Dtos;

/// <summary>Respuesta de GET /api/admin/resumen (tarjetas del dashboard).</summary>
public record ResumenDto(
    int TotalBodegas,
    int Disponibles,
    int Reservadas,
    int Ocupadas,
    decimal IngresoMensualEstimado,
    int TotalSolicitudes,
    int SolicitudesPendientes,
    int SolicitudesContactadas,
    int SolicitudesCerradas);

/// <summary>Respuesta de POST /api/admin/demo/reset.</summary>
public record DemoRestauradaDto(string Mensaje, List<BodegaAdminDto> Bodegas);
