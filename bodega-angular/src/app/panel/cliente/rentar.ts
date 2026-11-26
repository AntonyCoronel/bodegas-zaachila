import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { DineroPipe, FechaPipe, hoyIso } from '../../core/formato';
import { fotoReferencia, rutaEspacio } from '../../core/imagenes';
import { Icono } from '../icono/icono';
import { Plano } from '../plano/plano';

/** Rentar una bodega: elegirla en el plano o en la lista y enviar la solicitud al dueño. */
@Component({
  selector: 'app-cliente-rentar',
  imports: [FormsModule, RouterLink, Icono, Plano, DineroPipe, FechaPipe],
  templateUrl: './rentar.html',
  styleUrl: './rentar.css',
})
export class ClienteRentar {
  /** ?bodega=BOD-004 preselecciona una bodega (desde el plano o la ficha pública). */
  readonly bodega = input<string | undefined>();

  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  protected elegida = signal<string | null>(null);
  protected enviando = signal(false);
  protected error = signal<string | null>(null);

  protected fechaInicio = hoyIso();
  protected meses = 3;
  protected mensaje = '';
  protected readonly opcionesMeses = [1, 2, 3, 6, 12];
  protected readonly hoy = hoyIso();

  protected seleccion = computed(() => this.datos.bodegas().find((b) => b.id === this.elegida()) ?? null);
  protected miBodegaId = computed(() => {
    const c = this.datos.contratos().find((x) => x.estado !== 'Finalizado');
    return c?.bodegaId ?? null;
  });
  protected pendienteDe = (id: string) => this.datos.solicitudes().some((s) => s.bodegaId === id && s.estado === 'Pendiente');
  protected nombreBodega = (id: string) => this.datos.bodegas().find((b) => b.id === id)?.titulo ?? id;
  protected foto = fotoReferencia;
  protected ficha = rutaEspacio;

  constructor() {
    this.datos.cargar(['bodegas', 'solicitudes', 'contratos']);
    effect(() => {
      const id = this.bodega();
      if (id) this.elegida.set(id);
    });
  }

  protected elegir(id: string): void {
    this.elegida.set(id);
    this.error.set(null);
    this.router.navigate([], { queryParams: { bodega: id }, replaceUrl: true });
  }

  protected total(): number {
    return (this.seleccion()?.precio ?? 0) * (Number(this.meses) || 0);
  }

  protected async enviar(): Promise<void> {
    const b = this.seleccion();
    if (!b) return;
    if (!this.fechaInicio || this.fechaInicio < this.hoy) {
      this.error.set('Elige una fecha de inicio a partir de hoy.');
      return;
    }
    this.enviando.set(true);
    this.error.set(null);
    const r = await this.datos.ejecutar(
      this.api.crearSolicitud({ bodegaId: b.id, fechaInicio: this.fechaInicio, meses: Number(this.meses), mensaje: this.mensaje }),
    );
    this.enviando.set(false);
    if (r.ok) {
      this.aviso.ok(`Solicitud enviada para ${b.titulo}. Te avisaremos cuando el dueño responda.`);
      this.mensaje = '';
      this.elegida.set(null);
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    } else {
      this.error.set(r.error);
    }
  }
}
