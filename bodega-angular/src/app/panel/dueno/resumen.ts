import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { diasHasta, DineroPipe, FechaPipe, hoyIso, mes } from '../../core/formato';
import { Contrato } from '../../core/models';
import { GraficaIngresos, ingresosPorMes } from '../grafica/ingresos';
import { Icono } from '../icono/icono';
import { Plano } from '../plano/plano';

/** Resumen del dueño: el edificio de un vistazo, lo que necesita atención y cómo va el mes. */
@Component({
  selector: 'app-dueno-resumen',
  imports: [RouterLink, Icono, Plano, GraficaIngresos, DineroPipe, FechaPipe],
  templateUrl: './resumen.html',
  styleUrl: './dueno.css',
})
export class DuenoResumen {
  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);
  private router = inject(Router);

  protected mesActual = mes(hoyIso().slice(0, 7));
  protected pendientes = computed(() => this.datos.solicitudes().filter((s) => s.estado === 'Pendiente'));
  protected vencidos = computed(() => this.datos.pagos().filter((p) => p.estado === 'Vencido'));
  protected porIniciar = computed(() => this.datos.contratos().filter((c) => c.estado === 'Reservado'));
  protected totalPendientes = computed(() => this.pendientes().length + this.vencidos().length + this.porIniciar().length);

  protected cobradoMes = computed(() => {
    const m = hoyIso().slice(0, 7);
    return this.datos.pagos().filter((p) => p.estado === 'Pagado' && p.pagadoEn?.startsWith(m)).reduce((s, p) => s + p.monto, 0);
  });
  protected porCobrar = computed(() => this.datos.pagos().filter((p) => p.estado !== 'Pagado').reduce((s, p) => s + p.monto, 0));
  protected rentaMensual = computed(() =>
    this.datos.contratos().filter((c) => c.estado !== 'Finalizado').reduce((s, c) => s + c.precioMensual, 0),
  );
  protected ocupadas = computed(() => this.datos.bodegas().filter((b) => b.estado !== 'Disponible'));
  protected m2Ocupados = computed(() => this.ocupadas().reduce((s, b) => s + b.m2, 0));
  protected m2Totales = computed(() => this.datos.bodegas().reduce((s, b) => s + b.m2, 0));
  protected ingresos = computed(() => ingresosPorMes(this.datos.pagos()));
  protected recientes = computed(() => this.datos.solicitudes().slice(0, 4));

  protected nombreBodega = (id: string) => this.datos.bodegas().find((b) => b.id === id)?.titulo ?? id;
  protected contratoDe = (bodegaId: string) => this.datos.contratos().find((c) => c.bodegaId === bodegaId && c.estado !== 'Finalizado');
  protected sinEjemplo = (n: string) => n.replace(/\s*\(ejemplo\)/i, '');
  protected dias = diasHasta;
  protected abs = Math.abs;

  constructor() {
    this.datos.cargar(['bodegas', 'solicitudes', 'contratos', 'pagos']);
  }

  protected abrirBodega(id: string): void {
    this.router.navigate(['/dueno/bodegas'], { queryParams: { id } });
  }

  protected async activar(c: Contrato): Promise<void> {
    const r = await this.datos.ejecutar(this.api.activarContrato(c.id));
    if (r.ok) this.aviso.ok(`${this.nombreBodega(c.bodegaId)} quedó ocupada por ${this.sinEjemplo(c.clienteNombre)}.`);
    else this.aviso.error(r.error);
  }
}
