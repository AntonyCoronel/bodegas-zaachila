using BodegasZaachila.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Data;

/// <summary>
/// Datos de demostración. Son las mismas 4 bodegas del prototipo original (assets/js/data.js).
/// </summary>
public static class SeedData
{
    /// <summary>Crea la base de datos si no existe y carga las bodegas demo si está vacía.</summary>
    public static void Inicializar(AppDbContext db)
    {
        db.Database.EnsureCreated();
        if (!db.Bodegas.Any())
        {
            db.Bodegas.AddRange(BodegasDemo());
            db.SaveChanges();
        }
    }

    /// <summary>Borra solicitudes y bodegas y vuelve a cargar los datos demo (botón "Restaurar demo").</summary>
    public static async Task RestaurarAsync(AppDbContext db, CancellationToken ct = default)
    {
        await db.Solicitudes.ExecuteDeleteAsync(ct);
        await db.Bodegas.ExecuteDeleteAsync(ct);
        // Reinicia los contadores AUTOINCREMENT para que la próxima solicitud vuelva a ser la #1.
        await db.Database.ExecuteSqlRawAsync(
            "DELETE FROM sqlite_sequence WHERE name IN ('Solicitudes', 'Bodegas')", ct);
        db.ChangeTracker.Clear();
        db.Bodegas.AddRange(BodegasDemo());
        await db.SaveChangesAsync(ct);
    }

    public static List<Bodega> BodegasDemo() =>
    [
        new()
        {
            Id = 1, Codigo = "BOD-001", Nombre = "Bodega Mini", Slug = "mini", Volumen = 3, Precio = 499,
            Estado = EstadoBodega.Disponible, Cliente = null,
            Imagen = "assets/images/bodega-mini.png", Etiqueta = "Ideal para archivos",
            Descripcion = "Un espacio compacto para resguardar documentos, cajas y pertenencias personales.",
            Capacidad = "Documentos, maletas y aproximadamente 15 a 25 cajas pequeñas.",
            Dimensiones = "Referencia: 1.5 × 1 × 2 m (ancho × fondo × alto)",
            Acceso = "Acceso al espacio sujeto a los horarios y condiciones del servicio.",
            Contenido = ["Documentos y archivos", "Cajas pequeñas de mudanza", "Maletas y ropa de temporada", "Herramientas y decoración ligera"],
            Caracteristicas = ["Espacio compacto", "Organización para archivo personal", "Almacenamiento flexible", "Protección mediante candado"]
        },
        new()
        {
            Id = 2, Codigo = "BOD-002", Nombre = "Bodega Mediana", Slug = "mediana", Volumen = 6, Precio = 899,
            Estado = EstadoBodega.Reservada,
            Cliente = new Cliente { Nombre = "Ana Martínez (demo)", Telefono = "951 000 0002", Correo = "ana@example.com" },
            Imagen = "assets/images/bodega-mediana.png", Etiqueta = "La más versátil",
            Descripcion = "Ideal para guardar muebles pequeños, bicicletas y artículos durante una mudanza.",
            Capacidad = "Cajas medianas, bicicleta y mobiliario ligero de una habitación.",
            Dimensiones = "Referencia: 2 × 1.5 × 2 m (ancho × fondo × alto)",
            Acceso = "Acceso de clientes conforme a políticas de seguridad.",
            Contenido = ["Bicicleta y accesorios", "Muebles ligeros", "Contenedores y cajas de mudanza", "Equipo deportivo y herramientas"],
            Caracteristicas = ["Distribución versátil", "Espacio para mudanza parcial", "Organización por estantes", "Área techada y cerrada"]
        },
        new()
        {
            Id = 3, Codigo = "BOD-003", Nombre = "Bodega Comercial", Slug = "comercial", Volumen = 7, Precio = 1199,
            Estado = EstadoBodega.Ocupada,
            Cliente = new Cliente { Nombre = "Comercial Oaxaca (demo)", Telefono = "951 000 0003", Correo = "comercial@example.com" },
            Imagen = "assets/images/bodega-comercial.png", Etiqueta = "Para negocios",
            Descripcion = "Bodega para inventario pequeño de comercios, insumos y productos empaquetados.",
            Capacidad = "Estanterías, cajas de productos y material comercial no peligroso.",
            Dimensiones = "Referencia: 2 × 1.75 × 2 m (ancho × fondo × alto)",
            Acceso = "Acceso sujeto a autorización y horarios de la instalación.",
            Contenido = ["Productos empaquetados", "Estanterías y cajas de inventario", "Equipo ligero de oficina", "Material de distribución"],
            Caracteristicas = ["Pensada para inventario", "Espacio para estanterías", "Posibilidad de organizar por categorías", "Almacenamiento comercial"]
        },
        new()
        {
            Id = 4, Codigo = "BOD-004", Nombre = "Bodega Familiar", Slug = "familiar", Volumen = 12, Precio = 1799,
            Estado = EstadoBodega.Disponible, Cliente = null,
            Imagen = "assets/images/bodega-familiar.webp", Etiqueta = "Mayor capacidad",
            Descripcion = "Más espacio para cajas, muebles y artículos de una mudanza familiar.",
            Capacidad = "Muebles de un departamento pequeño, maletas y varias cajas grandes.",
            Dimensiones = "Referencia: 3 × 2 × 2 m (ancho × fondo × alto)",
            Acceso = "Acceso a confirmar según condiciones del contrato.",
            Contenido = ["Sala pequeña o muebles desmontados", "Cajas grandes de mudanza", "Colchones y artículos de temporada", "Electrodomésticos desconectados"],
            Caracteristicas = ["Mayor espacio para organización", "Útil en mudanzas familiares", "Almacenamiento temporal", "Ideal para artículos voluminosos"]
        }
    ];
}
