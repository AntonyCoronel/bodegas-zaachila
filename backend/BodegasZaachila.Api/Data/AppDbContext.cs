using BodegasZaachila.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Bodega> Bodegas => Set<Bodega>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Bodega>(bodega =>
        {
            bodega.HasIndex(b => b.Codigo).IsUnique();
            bodega.Property(b => b.Codigo).HasMaxLength(20);
            bodega.Property(b => b.Nombre).HasMaxLength(80);

            // SQLite no tiene tipo decimal: se guarda como REAL para poder ordenar y comparar precios.
            bodega.Property(b => b.Precio).HasConversion<double>();

            // Los enums se guardan como texto ("Disponible") para que la BD sea legible.
            bodega.Property(b => b.Estado).HasConversion<string>().HasMaxLength(20);

            // El cliente vive en la misma tabla (columnas ClienteNombre, ClienteTelefono, ClienteCorreo).
            bodega.OwnsOne(b => b.Cliente, cliente =>
            {
                cliente.Property(c => c.Nombre).HasColumnName("ClienteNombre").HasMaxLength(90);
                cliente.Property(c => c.Telefono).HasColumnName("ClienteTelefono").HasMaxLength(25);
                cliente.Property(c => c.Correo).HasColumnName("ClienteCorreo").HasMaxLength(100);
            });

            // Una bodega con solicitudes no se puede borrar (el controlador responde 409).
            bodega.HasMany(b => b.Solicitudes)
                  .WithOne(s => s.Bodega)
                  .HasForeignKey(s => s.BodegaId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Solicitud>(solicitud =>
        {
            solicitud.Property(s => s.Estado).HasConversion<string>().HasMaxLength(20);
            solicitud.Property(s => s.Nombre).HasMaxLength(90);
            solicitud.Property(s => s.Telefono).HasMaxLength(25);
            solicitud.Property(s => s.Correo).HasMaxLength(100);
            solicitud.Property(s => s.Mensaje).HasMaxLength(1000);
        });
    }
}
