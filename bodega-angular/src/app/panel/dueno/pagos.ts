import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { diasHasta, DineroPipe, FechaPipe, hoyIso, mes } from '../../core/formato';
import { EstadoPago, MetodoPago, Pago } from '../../core/models';
import { GraficaIngresos, ingresosPorMes } from '../grafica/ingresos';
import { Icono } from '../icono/icono';

type Filtro = EstadoPago | 'Todos';
const ORDEN: Record<EstadoPago, number> = { Vencido: 0, Pendiente: 1, Pagado: 2 };

/** Pagos e ingresos: lo cobrado, lo pendiente, lo vencido y registrar pagos en oficina. */
@Component({
  selector: 'app-dueno-pagos',
  imports: [FormsModule, Icono, GraficaIngresos, DineroPipe, FechaPipe],
  templateUrl: './pagos.html',
  styleUrls: ['./dueno.css', './pagos.css'],
})
export class DuenoPagos {
  /** ?filtro=Vencido abre la lista filtrada. */
  readonly filtroInicial = input<string | undefined>(undefined, { alias: 'filtro' });

  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);

  protected readonly filtros: Filtro[] = ['Todos', 'Vencido', 'Pendiente', 'Pagado'];
  protected filtro = signal<Filtro>('Todos');
  protected busqueda = signal('');
  protected registrando = signal<string | null>(null);
  protected trabajando = signal(false);
  protected metodo: MetodoPago = 'Efectivo';

  protected mesActual = mes(hoyIso().slice(0, 7));
  protected cobradoMes = computed(() => {
    const m = hoyIso().slice(0, 7);
    return this.datos.pagos().filter((p) => p.estado === 'Pagado' && p.pagadoEn?.startsWith(m)).reduce((s, p) => s + p.monto, 0);
  });
  protected pendiente = computed(() => this.suma('Pendiente'));
  protected vencido = computed(() => this.suma('Vencido'));
  protected ingresos = computed(() => ingresosPorMes(this.datos.pagos()));
  protected totalSeis = computed(() => this.ingresos().reduce((s, p) => s + p.monto, 0));

  protected lista = computed(() => {
    const f = this.filtro();
    const q = this.busqueda().trim().toLowerCase();
    return this.datos
      .pagos()
      .filter((p) => f === 'Todos' || p.estado === f)
      .filter((p) => !q || p.clienteNombre.toLowerCase().includes(q) || p.folio.toLowerCase().includes(q) || p.bodegaId.toLowerCase().includes(q))
      // Primero lo vencido, luego lo pendiente y al final lo pagado (más reciente arriba).
      .sort((a, b) => ORDEN[a.estado] - ORDEN[b.estado] || b.vence.localeCompare(a.vence));
  });
  protected cuenta = (f: Filtro) => (f === 'Todos' ? this.datos.pagos().length : this.datos.pagos().filter((p) => p.estado === f).length);
  protected etiqueta = (f: Filtro) => ({ Todos: 'Todos', Vencido: 'Vencidos', Pendiente: 'Pendientes', Pagado: 'Pagados' })[f];
  protected dias = diasHasta;
  protected abs = Math.abs;

  constructor() {
    this.datos.cargar(['pagos', 'bodegas']);
    effect(() => {
      const f = this.filtroInicial();
      if (f && (this.filtros as string[]).includes(f)) this.filtro.set(f as Filtro);
    });
  }

  private suma(estado: EstadoPago): number {
    return this.datos.pagos().filter((p) => p.estado === estado).reduce((s, p) => s + p.monto, 0);
  }

  protected abrir(p: Pago): void {
    this.registrando.set(this.registrando() === p.id ? null : p.id);
    this.metodo = 'Efectivo';
  }

  protected async registrar(p: Pago): Promise<void> {
    this.trabajando.set(true);
    const r = await this.datos.ejecutar(this.api.pagar(p.id, this.metodo));
    this.trabajando.set(false);
    if (r.ok) {
      this.registrando.set(null);
      this.aviso.ok(`Pago de ${p.clienteNombre} registrado. Folio ${r.valor.folio}.`);
    } else this.aviso.error(r.error);
  }
}
