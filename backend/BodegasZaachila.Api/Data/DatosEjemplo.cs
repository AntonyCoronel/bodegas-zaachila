using System.Globalization;
using BodegasZaachila.Api.Models;
using BodegasZaachila.Api.Servicios;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Data;

/// <summary>
/// Datos de ejemplo: los mismos de bodega-angular/src/app/core/mock/mock-db.ts.
/// 4 bodegas, 1 dueño, 5 clientes ficticios, contratos y pagos de marzo a diciembre de 2026.
/// Cuentas de prueba: dueno@ejemplo.com y maria@ejemplo.com, contraseña demo123.
/// </summary>
public static class DatosEjemplo
{
    public const string PasswordDemo = "demo123";

    /// <summary>Crea la base si no existe y carga los datos de ejemplo si está vacía.</summary>
    public static void Inicializar(AppDbContext db, IPasswordHasher<Usuario> hasher)
    {
        db.Database.EnsureCreated();
        if (db.Usuarios.Any())
            return;

        Cargar(db, hasher);
        db.SaveChanges();
    }

    /// <summary>Borra todo y vuelve a cargar los datos de ejemplo (POST /api/demo/reiniciar).</summary>
    public static async Task ReiniciarAsync(AppDbContext db, IPasswordHasher<Usuario> hasher, CancellationToken ct)
    {
        await using var transaccion = await db.Database.BeginTransactionAsync(ct);
        await db.Pagos.ExecuteDeleteAsync(ct);
        await db.Contratos.ExecuteDeleteAsync(ct);
        await db.Solicitudes.ExecuteDeleteAsync(ct);
        await db.Bodegas.ExecuteDeleteAsync(ct);
        await db.Usuarios.ExecuteDeleteAsync(ct);
        await db.Secuencias.ExecuteDeleteAsync(ct);
        db.ChangeTracker.Clear();

        Cargar(db, hasher);
        await db.SaveChangesAsync(ct);
        await transaccion.CommitAsync(ct);
    }

    private static DateOnly Dia(string texto) =>
        DateOnly.ParseExact(texto, "yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static DateTime Momento(string texto) =>
        DateTime.ParseExact(texto, "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);

    private static void Cargar(AppDbContext db, IPasswordHasher<Usuario> hasher)
    {
        Usuario U(string id, string nombre, string correo, string telefono, Rol rol, string registrado)
        {
            var usuario = new Usuario
            {
                Id = id, Nombre = nombre, Correo = correo, Telefono = telefono, Rol = rol,
                RegistradoEn = Dia(registrado)
            };
            usuario.PasswordHash = hasher.HashPassword(usuario, PasswordDemo);
            return usuario;
        }

        db.Usuarios.AddRange(
            U("u-dueno", "Administración Bodega Segura", "dueno@ejemplo.com", "951 461 6417", Rol.Dueno, "2026-01-10"),
            U("u-maria", "María López (ejemplo)", "maria@ejemplo.com", "951 000 0001", Rol.Cliente, "2026-05-20"),
            U("u-juan", "Juan Pérez (ejemplo)", "juan@ejemplo.com", "951 000 0002", Rol.Cliente, "2026-11-15"),
            U("u-ana", "Ana Martínez (ejemplo)", "ana@ejemplo.com", "951 000 0003", Rol.Cliente, "2026-11-22"),
            U("u-comercial", "Comercial Oaxaca (ejemplo)", "comercial@ejemplo.com", "951 000 0004", Rol.Cliente, "2026-02-25"),
            U("u-luis", "Luis Hernández (ejemplo)", "luis@ejemplo.com", "951 000 0005", Rol.Cliente, "2026-06-28"));

        db.Bodegas.AddRange(
            new Bodega
            {
                Id = "BOD-001", Slug = "pequeno", Titulo = "Espacio pequeño", Dimensiones = "2 × 2 m",
                Ancho = 2, Fondo = 2, M2 = 4, Precio = 499, Estado = EstadoBodega.Disponible, ClienteId = null,
                Descripcion = "Un espacio compacto para mantener organizados objetos personales, cajas y documentación.",
                Usos = ["Cajas y documentos", "Objetos personales", "Archivos y artículos de temporada"],
                Detalles = ["Almacenamiento para pocas cajas", "Fácil organización del espacio", "Ideal para uso personal"]
            },
            new Bodega
            {
                Id = "BOD-002", Slug = "mediano", Titulo = "Espacio mediano", Dimensiones = "3 × 3 m",
                Ancho = 3, Fondo = 3, M2 = 9, Precio = 899, Estado = EstadoBodega.Reservada, ClienteId = "u-juan",
                Descripcion = "Una opción intermedia para muebles, cajas de mudanza y mercancía de pequeños negocios.",
                Usos = ["Muebles y sillas", "Electrodomésticos", "Inventario pequeño"],
                Detalles = ["Útil para pequeñas mudanzas", "Espacio versátil para cajas", "Adecuado para artículos domésticos"]
            },
            new Bodega
            {
                Id = "BOD-003", Slug = "grande", Titulo = "Espacio grande", Dimensiones = "4 × 5 m",
                Ancho = 4, Fondo = 5, M2 = 20, Precio = 1199, Estado = EstadoBodega.Ocupada, ClienteId = "u-maria",
                Descripcion = "Bodega amplia para mobiliario, equipo de oficina y mercancías de un negocio.",
                Usos = ["Muebles de una casa", "Mercancía", "Equipos de oficina"],
                Detalles = ["Permite separar artículos por zonas", "Pensada para inventarios medianos", "Mayor espacio para maniobrar"]
            },
            new Bodega
            {
                Id = "BOD-004", Slug = "extra-grande", Titulo = "Espacio extra grande", Dimensiones = "5 × 8 m",
                Ancho = 5, Fondo = 8, M2 = 40, Precio = 1799, Estado = EstadoBodega.Disponible, ClienteId = null,
                Descripcion = "El espacio más amplio del catálogo, adecuado para proyectos que requieren guardar más artículos.",
                Usos = ["Automóviles, sujeto a condiciones", "Inventario empresarial", "Mudanzas y mobiliario voluminoso"],
                Detalles = ["Gran superficie de almacenamiento", "Apropiado para múltiples tipos de bienes", "Consulta condiciones para vehículos"]
            });

        Contrato C(string id, string clienteId, string bodegaId, string inicio, string fin, int meses, int precio, EstadoContrato estado, string codigo) =>
            new()
            {
                Id = id, ClienteId = clienteId, BodegaId = bodegaId, Inicio = Dia(inicio), Fin = Dia(fin),
                Meses = meses, PrecioMensual = precio, Estado = estado, CodigoAcceso = codigo
            };

        db.Contratos.AddRange(
            C("CON-0001", "u-comercial", "BOD-001", "2026-03-01", "2026-09-01", 6, 499, EstadoContrato.Finalizado, "3307"),
            C("CON-0002", "u-maria", "BOD-003", "2026-06-01", "2027-06-01", 12, 1199, EstadoContrato.Activo, "4821"),
            C("CON-0003", "u-luis", "BOD-004", "2026-07-01", "2026-12-01", 5, 1799, EstadoContrato.Finalizado, "9154"),
            C("CON-0004", "u-juan", "BOD-002", "2026-12-01", "2027-06-01", 6, 899, EstadoContrato.Reservado, "6639"));

        var folio = 1;
        void Pagado(string contratoId, string periodo, int monto, string dia, MetodoPago metodo)
        {
            db.Pagos.Add(new Pago
            {
                Id = $"PAG-{folio:0000}", Folio = $"F-{folio:00000}", ContratoId = contratoId,
                Concepto = $"Mensualidad {Fechas.NombreMes(periodo)}", Periodo = periodo, Monto = monto,
                Vence = Dia($"{periodo}-10"), Estado = EstadoPago.Pagado,
                PagadoEn = Momento($"{periodo}-{dia}T11:00:00"), Metodo = metodo
            });
            folio++;
        }
        void Pendiente(string contratoId, string periodo, int monto, string vence)
        {
            db.Pagos.Add(new Pago
            {
                Id = $"PAG-{folio:0000}", Folio = $"F-{folio:00000}", ContratoId = contratoId,
                Concepto = $"Mensualidad {Fechas.NombreMes(periodo)}", Periodo = periodo, Monto = monto,
                Vence = Dia(vence), Estado = EstadoPago.Pendiente
            });
            folio++;
        }

        foreach (var m in new[] { "03", "04", "05", "06", "07", "08" }) Pagado("CON-0001", $"2026-{m}", 499, "04", MetodoPago.Efectivo);
        foreach (var m in new[] { "06", "07", "08", "09", "10" }) Pagado("CON-0002", $"2026-{m}", 1199, "06", MetodoPago.Transferencia);
        foreach (var m in new[] { "07", "08", "09", "10", "11" }) Pagado("CON-0003", $"2026-{m}", 1799, "08", MetodoPago.Tarjeta);
        Pendiente("CON-0002", "2026-11", 1199, "2026-11-10");
        Pendiente("CON-0004", "2026-12", 899, "2026-12-01");

        db.Solicitudes.AddRange(
            new Solicitud
            {
                Id = "SOL-0001", ClienteId = "u-juan", BodegaId = "BOD-002", FechaInicio = Dia("2026-12-01"), Meses = 6,
                Mensaje = "Necesito guardar los muebles de mi departamento mientras me mudo.", Estado = EstadoSolicitud.Aprobada,
                Respuesta = "Aprobada. Tu bodega queda reservada a partir del 1 de diciembre.", CreadaEn = Momento("2026-11-16T10:20:00")
            },
            new Solicitud
            {
                Id = "SOL-0002", ClienteId = "u-ana", BodegaId = "BOD-004", FechaInicio = Dia("2026-12-01"), Meses = 3,
                Mensaje = "Es para el inventario de temporada de mi tienda.", Estado = EstadoSolicitud.Pendiente,
                Respuesta = null, CreadaEn = Momento("2026-11-23T17:45:00")
            },
            new Solicitud
            {
                Id = "SOL-0003", ClienteId = "u-ana", BodegaId = "BOD-003", FechaInicio = Dia("2026-11-25"), Meses = 1,
                Mensaje = "Solo por un mes.", Estado = EstadoSolicitud.Rechazada,
                Respuesta = "Esta bodega ya está ocupada. Te sugerimos el espacio extra grande.", CreadaEn = Momento("2026-11-22T09:05:00")
            });

        db.Secuencias.Add(new Secuencia { Nombre = "general", Valor = 100 });
    }
}
