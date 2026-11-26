import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { DineroPipe, FechaPipe } from '../../core/formato';
import { EstadoSolicitud, Solicitud } from '../../core/models';
import { Icono } from '../icono/icono';

type Filtro = EstadoSolicitud | 'Todas';

/** Solicitudes de renta: aprobar (aparta la bodega al cliente) o rechazar con un motivo. */
@Component({
  selector: 'app-dueno-solicitudes',
  imports: [FormsModule, Icono, DineroPipe, FechaPipe],
  templateUrl: './solicitudes.html',
  styleUrls: ['./dueno.css', './solicitudes.css'],
})
export class DuenoSolicitudes {
  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);

  protected readonly filtros: Filtro[] = ['Pendiente', 'Aprobada', 'Rechazada', 'Todas'];
  protected filtro = signal<Filtro>('Pendiente');
  protected rechazando = signal<string | null>(null);
  protected trabajando = signal<string | null>(null);
  protected motivo = '';

  protected lista = computed(() => {
    const f = this.filtro();
    return f === 'Todas' ? this.datos.solicitudes() : this.datos.solicitudes().filter((s) => s.estado === f);
  });
  protected cuenta = (f: Filtro) => (f === 'Todas' ? this.datos.solicitudes().length : this.datos.solicitudes().filter((s) => s.estado === f).length);
  protected bodega = (id: string) => this.datos.bodegas().find((b) => b.id === id) ?? null;
  protected etiqueta = (f: Filtro) => (f === 'Todas' ? 'Todas' : f === 'Pendiente' ? 'Pendientes' : `${f}s`);

  constructor() {
    this.datos.cargar(['solicitudes', 'bodegas']);
  }

  protected async aprobar(s: Solicitud): Promise<void> {
    this.trabajando.set(s.id);
    const r = await this.datos.ejecutar(this.api.aprobarSolicitud(s.id));
    this.trabajando.set(null);
    if (r.ok) this.aviso.ok(`Aprobada. ${this.bodega(s.bodegaId)?.titulo} quedó reservada para ${s.clienteNombre}.`);
    else this.aviso.error(r.error);
  }

  protected abrirRechazo(s: Solicitud): void {
    this.rechazando.set(s.id);
    this.motivo = '';
  }

  protected async rechazar(s: Solicitud): Promise<void> {
    this.trabajando.set(s.id);
    const r = await this.datos.ejecutar(this.api.rechazarSolicitud(s.id, this.motivo));
    this.trabajando.set(null);
    if (r.ok) {
      this.rechazando.set(null);
      this.aviso.ok(`Solicitud de ${s.clienteNombre} rechazada.`);
    } else this.aviso.error(r.error);
  }
}
