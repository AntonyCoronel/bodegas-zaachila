import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { DineroPipe, FechaPipe } from '../../core/formato';
import { fotoReferencia, rutaEspacio } from '../../core/imagenes';
import { Contrato, EstadoBodega } from '../../core/models';
import { Icono } from '../icono/icono';
import { Plano } from '../plano/plano';

/** Bodegas: el plano, la tabla y el panel para editar precio, estado y cliente asignado. */
@Component({
  selector: 'app-dueno-bodegas',
  imports: [FormsModule, RouterLink, Icono, Plano, DineroPipe, FechaPipe],
  templateUrl: './bodegas.html',
  styleUrls: ['./dueno.css', './bodegas.css'],
})
export class DuenoBodegas {
  /** ?id=BOD-003 abre esa bodega. */
  readonly id = input<string | undefined>();

  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  protected elegida = signal<string | null>(null);
  protected guardando = signal(false);
  protected error = signal<string | null>(null);
  protected confirmarFin = signal(false);

  protected precio = 0;
  protected estado: EstadoBodega = 'Disponible';
  protected clienteId = '';

  protected bodega = computed(() => this.datos.bodegas().find((b) => b.id === this.elegida()) ?? null);
  protected contrato = computed(() => this.datos.contratos().find((c) => c.bodegaId === this.elegida() && c.estado !== 'Finalizado') ?? null);
  protected contratoDe = (bodegaId: string) => this.datos.contratos().find((c) => c.bodegaId === bodegaId && c.estado !== 'Finalizado');
  protected foto = fotoReferencia;
  protected ficha = rutaEspacio;

  constructor() {
    this.datos.cargar(['bodegas', 'contratos', 'clientes']);
    effect(() => {
      const id = this.id();
      if (id) this.elegida.set(id);
    });
    // Cada vez que cambia la bodega elegida (o se recargan los datos), el formulario toma sus valores.
    effect(() => {
      const b = this.bodega();
      if (!b) return;
      this.precio = b.precio;
      this.estado = b.estado;
      this.clienteId = b.clienteId ?? '';
      this.error.set(null);
      this.confirmarFin.set(false);
    });
  }

  protected elegir(id: string): void {
    this.elegida.set(id);
    this.router.navigate([], { queryParams: { id }, replaceUrl: true });
  }

  protected cambiado(): boolean {
    const b = this.bodega();
    if (!b) return false;
    return Number(this.precio) !== b.precio || this.estado !== b.estado || (this.estado !== 'Disponible' && this.clienteId !== (b.clienteId ?? ''));
  }

  protected async guardar(): Promise<void> {
    const b = this.bodega();
    if (!b) return;
    const precio = Number(this.precio);
    if (!Number.isFinite(precio) || precio <= 0) return this.error.set('Introduce un precio mensual válido.');
    if (this.estado !== 'Disponible' && !this.clienteId) return this.error.set('Elige el cliente al que se reserva u ocupa la bodega.');
    this.guardando.set(true);
    const r = await this.datos.ejecutar(
      this.api.editarBodega(b.id, { precio, estado: this.estado, clienteId: this.estado === 'Disponible' ? null : this.clienteId }),
    );
    this.guardando.set(false);
    if (r.ok) this.aviso.ok(`${b.titulo} actualizada.`);
    else this.error.set(r.error);
  }

  protected async activar(c: Contrato): Promise<void> {
    const r = await this.datos.ejecutar(this.api.activarContrato(c.id));
    if (r.ok) this.aviso.ok('La bodega quedó ocupada y el código de acceso del cliente ya funciona.');
    else this.aviso.error(r.error);
  }

  protected async finalizar(c: Contrato): Promise<void> {
    const r = await this.datos.ejecutar(this.api.finalizarContrato(c.id));
    this.confirmarFin.set(false);
    if (r.ok) this.aviso.ok('Contrato finalizado. La bodega vuelve a estar disponible.');
    else this.aviso.error(r.error);
  }
}
