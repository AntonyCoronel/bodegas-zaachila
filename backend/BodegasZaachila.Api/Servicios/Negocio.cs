using System.Security.Cryptography;
using BodegasZaachila.Api.Data;
using BodegasZaachila.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Servicios;

/// <summary>
/// Reglas que comparten varios controladores: ids, contratos y mensualidades.
/// Sigue la lógica del backend simulado (bodega-angular/src/app/core/mock/mock-backend.interceptor.ts).
/// </summary>
public static class Negocio
{
    private const string SecuenciaGeneral = "general";

    /// <summary>Siguiente id con prefijo: SOL-0101, CON-0102, PAG-0103, u-0104. Un solo contador para todo.</summary>
    public static async Task<string> SiguienteIdAsync(AppDbContext db, string prefijo, CancellationToken ct)
    {
        var secuencia = await db.Secuencias.FindAsync([SecuenciaGeneral], ct);
        if (secuencia is null)
        {
            secuencia = new Secuencia { Nombre = SecuenciaGeneral, Valor = 100 };
            db.Secuencias.Add(secuencia);
        }
        secuencia.Valor++;
        return $"{prefijo}-{secuencia.Valor:0000}";
    }

    /// <summary>Contrato vigente (no finalizado) de una bodega.</summary>
    public static Task<Contrato?> ContratoVigenteAsync(AppDbContext db, string bodegaId, CancellationToken ct) =>
        db.Contratos.FirstOrDefaultAsync(c => c.BodegaId == bodegaId && c.Estado != EstadoContrato.Finalizado, ct);

    /// <summary>
    /// Crea un contrato desde <paramref name="inicio"/> por <paramref name="meses"/> meses con el precio actual
    /// de la bodega, un código de acceso al azar y su primer pago pendiente (vence el día de inicio).
    /// </summary>
    public static async Task<Contrato> CrearContratoAsync(
        AppDbContext db, string clienteId, Bodega bodega, DateOnly inicio, int meses, EstadoContrato estado, CancellationToken ct)
    {
        var contrato = new Contrato
        {
            Id = await SiguienteIdAsync(db, "CON", ct),
            ClienteId = clienteId,
            BodegaId = bodega.Id,
            Inicio = inicio,
            Fin = inicio.AddMonths(meses),
            Meses = meses,
            PrecioMensual = bodega.Precio,
            Estado = estado,
            CodigoAcceso = RandomNumberGenerator.GetInt32(1000, 10000).ToString()
        };
        db.Contratos.Add(contrato);
        await CrearPagoPendienteAsync(db, contrato, Fechas.Periodo(inicio), inicio, ct);
        return contrato;
    }

    /// <summary>Agrega la mensualidad de <paramref name="periodo"/> (AAAA-MM) como pendiente.</summary>
    public static async Task<Pago> CrearPagoPendienteAsync(
        AppDbContext db, Contrato contrato, string periodo, DateOnly vence, CancellationToken ct)
    {
        // Cuenta también los pagos agregados en esta misma petición y aún no guardados.
        var guardados = await db.Pagos.CountAsync(ct);
        var nuevos = db.ChangeTracker.Entries<Pago>().Count(e => e.State == EntityState.Added);

        var pago = new Pago
        {
            Id = await SiguienteIdAsync(db, "PAG", ct),
            Folio = $"F-{guardados + nuevos + 1:00000}",
            ContratoId = contrato.Id,
            Concepto = $"Mensualidad {Fechas.NombreMes(periodo)}",
            Periodo = periodo,
            Monto = contrato.PrecioMensual,
            Vence = vence,
            Estado = EstadoPago.Pendiente
        };
        db.Pagos.Add(pago);
        return pago;
    }
}
