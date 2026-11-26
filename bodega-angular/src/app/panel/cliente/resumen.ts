import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { diasHasta, DineroPipe, FechaPipe } from '../../core/formato';
import { fotoInterior, rutaEspacio } from '../../core/imagenes';
import { Icono } from '../icono/icono';
import { Plano } from '../plano/plano';

/** Panel del cliente: su bodega, su próximo pago, su código de acceso y sus solicitudes. */
@Component({
  selector: 'app-cliente-resumen',
  imports: [RouterLink, Icono, Plano, DineroPipe, FechaPipe],
  templateUrl: './resumen.html',
  styleUrl: './resumen.css',
})
export class ClienteResumen {
  protected datos = inject(DatosService);
  private auth = inject(AuthService);
  private router = inject(Router);

  protected nombre = computed(() => (this.auth.usuario()?.nombre ?? '').replace(/\s*\(.*?\)/, '').split(' ')[0]);
  protected contrato = computed(() => {
    const cs = this.datos.contratos();
    return cs.find((c) => c.estado === 'Activo') ?? cs.find((c) => c.estado === 'Reservado') ?? null;
  });
  protected bodega = computed(() => this.datos.bodegas().find((b) => b.id === this.contrato()?.bodegaId) ?? null);
  protected porPagar = computed(() =>
    this.datos.pagos().filter((p) => p.estado !== 'Pagado').sort((a, b) => a.vence.localeCompare(b.vence)),
  );
  protected proximo = computed(() => this.porPagar()[0] ?? null);
  protected dias = computed(() => (this.proximo() ? diasHasta(this.proximo()!.vence) : 0));
  protected vencidos = computed(() => this.porPagar().filter((p) => p.estado === 'Vencido').length);
  protected solicitudes = computed(() => this.datos.solicitudes().slice(0, 3));
  protected nombreBodega = (id: string) => this.datos.bodegas().find((b) => b.id === id)?.titulo ?? id;

  protected mostrarCodigo = signal(false);
  protected foto = fotoInterior;
  protected ficha = rutaEspacio;
  protected abs = Math.abs;

  constructor() {
    this.datos.cargar(['bodegas', 'contratos', 'pagos', 'solicitudes']);
  }

  protected elegirEnPlano(id: string): void {
    const b = this.datos.bodegas().find((x) => x.id === id);
    if (!b) return;
    if (b.id === this.bodega()?.id) this.router.navigateByUrl(rutaEspacio(b.slug));
    else this.router.navigate(['/cliente/rentar'], { queryParams: { bodega: id } });
  }
}
