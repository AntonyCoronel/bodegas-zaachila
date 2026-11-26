using System.Globalization;

namespace BodegasZaachila.Api.Servicios;

/// <summary>Fechas con los formatos de API.md: días AAAA-MM-DD, momentos AAAA-MM-DDTHH:mm:ss, periodos AAAA-MM.</summary>
public static class Fechas
{
    private static readonly string[] Meses =
        ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

    /// <summary>
    /// Zona horaria del negocio (appsettings "ZonaHoraria", por defecto America/Mexico_City).
    /// Así "hoy" es el mismo día que ve el cliente aunque el servidor esté en UTC.
    /// </summary>
    public static TimeZoneInfo Zona { get; private set; } = TimeZoneInfo.Local;

    public static void ConfigurarZona(string? id)
    {
        if (!string.IsNullOrWhiteSpace(id) && TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zona))
            Zona = zona;
    }

    /// <summary>Fecha de hoy en la zona del negocio.</summary>
    public static DateOnly Hoy() => DateOnly.FromDateTime(AhoraEnZona());

    /// <summary>Hora actual sin milisegundos ni zona: se serializa como "2026-11-23T17:45:00".</summary>
    public static DateTime Ahora()
    {
        var ahora = AhoraEnZona();
        return new DateTime(ahora.Year, ahora.Month, ahora.Day, ahora.Hour, ahora.Minute, ahora.Second, DateTimeKind.Unspecified);
    }

    private static DateTime AhoraEnZona() => TimeZoneInfo.ConvertTime(DateTime.UtcNow, Zona);

    public static string Periodo(DateOnly fecha) => fecha.ToString("yyyy-MM", CultureInfo.InvariantCulture);

    public static DateOnly InicioDePeriodo(string periodo) =>
        DateOnly.ParseExact($"{periodo}-01", "yyyy-MM-dd", CultureInfo.InvariantCulture);

    /// <summary>"2026-11" → "noviembre 2026".</summary>
    public static string NombreMes(string periodo)
    {
        var inicio = InicioDePeriodo(periodo);
        return $"{Meses[inicio.Month - 1]} {inicio.Year}";
    }

    /// <summary>Acepta solo AAAA-MM-DD.</summary>
    public static bool TryDia(string? texto, out DateOnly fecha) =>
        DateOnly.TryParseExact(texto?.Trim(), "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out fecha);

    /// <summary>"01/12/2026", para los mensajes.</summary>
    public static string Corta(DateOnly fecha) => fecha.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture);
}
