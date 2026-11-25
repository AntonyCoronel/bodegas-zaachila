namespace BodegasZaachila.Api.Models;

/// <summary>
/// Convierte texto a los enums de estado (EstadoBodega, EstadoSolicitud).
/// Solo acepta los nombres ("Disponible", "pendiente"...): rechaza números y combinaciones como "1" o "A,B".
/// </summary>
public static class Estados
{
    public static bool TryParse<TEnum>(string? texto, out TEnum valor) where TEnum : struct, Enum
    {
        valor = default;
        if (string.IsNullOrWhiteSpace(texto) || texto.Contains(',') || int.TryParse(texto, out _))
            return false;

        return Enum.TryParse(texto.Trim(), ignoreCase: true, out valor) && Enum.IsDefined(valor);
    }

    /// <summary>Para valores que ya pasaron la validación.</summary>
    public static TEnum Parse<TEnum>(string texto) where TEnum : struct, Enum =>
        TryParse<TEnum>(texto, out var valor)
            ? valor
            : throw new ArgumentException($"Estado inválido: {texto}", nameof(texto));
}
