namespace BodegasZaachila.Api.Models;

/// <summary>Datos de contacto de la empresa. Se leen de la sección "Empresa" de appsettings.json.</summary>
public class EmpresaOptions
{
    public const string Seccion = "Empresa";

    public string Nombre { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Correo { get; set; } = string.Empty;
    public string Direccion { get; set; } = string.Empty;
    public string WhatsApp { get; set; } = string.Empty;
}
