using BodegasZaachila.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BodegasZaachila.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Bodega> Bodegas => Set<Bodega>();
    public DbSet<Solicitud> Solicitudes => Set<Solicitud>();
    public DbSet<Contrato> Contratos => Set<Contrato>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<Secuencia> Secuencias => Set<Secuencia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Correo).IsUnique();
            e.Property(u => u.Id).HasMaxLength(40);
            e.Property(u => u.Nombre).HasMaxLength(100);
            e.Property(u => u.Correo).HasMaxLength(120);
            e.Property(u => u.Telefono).HasMaxLength(30);
            e.Property(u => u.Rol).HasConversion<string>().HasMaxLength(10);
        });

        modelBuilder.Entity<Bodega>(e =>
        {
            e.HasKey(b => b.Id);
            e.HasIndex(b => b.Slug).IsUnique();
            e.Property(b => b.Estado).HasConversion<string>().HasMaxLength(12);
            e.HasOne(b => b.Cliente).WithMany().HasForeignKey(b => b.ClienteId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Solicitud>(e =>
        {
            e.HasKey(s => s.Id);
            e.Property(s => s.Estado).HasConversion<string>().HasMaxLength(12);
            e.Property(s => s.Mensaje).HasMaxLength(500);
            e.HasOne(s => s.Cliente).WithMany().HasForeignKey(s => s.ClienteId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Bodega>().WithMany().HasForeignKey(s => s.BodegaId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Contrato>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Estado).HasConversion<string>().HasMaxLength(12);
            e.Property(c => c.CodigoAcceso).HasMaxLength(4);
            e.HasOne(c => c.Cliente).WithMany().HasForeignKey(c => c.ClienteId).OnDelete(DeleteBehavior.Restrict);
            e.HasOne<Bodega>().WithMany().HasForeignKey(c => c.BodegaId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Pago>(e =>
        {
            e.HasKey(p => p.Id);
            e.HasIndex(p => p.Folio).IsUnique();
            e.Property(p => p.Estado).HasConversion<string>().HasMaxLength(12);
            e.Property(p => p.Metodo).HasConversion<string>().HasMaxLength(15);
            e.Property(p => p.Periodo).HasMaxLength(7);
            e.HasOne(p => p.Contrato).WithMany().HasForeignKey(p => p.ContratoId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Secuencia>().HasKey(s => s.Nombre);
    }
}
