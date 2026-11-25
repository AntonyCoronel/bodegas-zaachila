using BodegasZaachila.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BodegasZaachila.Api.Controllers.Usuarios;

[ApiController]
[Route("api/empresa")]
[Tags("Usuarios")]
[Produces("application/json")]
public class EmpresaController(IOptions<EmpresaOptions> empresa) : ControllerBase
{
    /// <summary>Datos de contacto de la empresa (configurados en appsettings.json).</summary>
    [HttpGet]
    public ActionResult<EmpresaOptions> Get() => empresa.Value;
}
