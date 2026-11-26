import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { diasHasta, DineroPipe, FechaPipe } from '../../core/formato';
import { MetodoPago, Pago } from '../../core/models';
import { Icono } from '../icono/icono';

const METODOS: { valor: MetodoPago; titulo: string; texto: string; icono: string }[] = [
  { valor: 'Tarjeta', titulo: 'Tarjeta', texto: 'Débito o crédito, se refleja al momento.', icono: 'tarjeta' },
  { valor: 'Transferencia', titulo: 'Transferencia', texto: 'Desde la app de tu banco.', icono: 'transferencia' },
  { valor: 'Efectivo', titulo: 'Efectivo en oficina', texto: 'Paga en recepción en horario de oficina.', icono: 'efectivo' },
];

/** Pagos del cliente: lo que debe, pagar en línea (simulado) y su historial. */
@Component({
  selector: 'app-cliente-pagos',
  imports: [RouterLink, Icono, DineroPipe, FechaPipe],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class ClientePagos {
  /** ?pagar=PAG-0012 abre directamente el pago indicado. */
  readonly pagar = input<string | undefined>();

  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private aviso = inject(AvisoService);

  protected readonly metodos = METODOS;
  protected abierto = signal<string | null>(null);
  protected metodo = signal<MetodoPago>('Tarjeta');
  protected pagando = signal(false);
  protected error = signal<string | null>(null);
  protected recibo = signal<Pago | null>(null);

  protected porPagar = computed(() =>
    this.datos.pagos().filter((p) => p.estado !== 'Pagado').sort((a, b) => a.vence.localeCompare(b.vence)),
  );
  protected historial = computed(() => this.datos.pagos().filter((p) => p.estado === 'Pagado'));
  protected totalPagado = computed(() => this.historial().reduce((s, p) => s + p.monto, 0));
  protected contrato = computed(() => this.datos.contratos().find((c) => c.estado === 'Activo') ?? this.datos.contratos().find((c) => c.estado === 'Reservado') ?? null);
  protected nombreBodega = (id: string) => this.datos.bodegas().find((b) => b.id === id)?.titulo ?? id;
  protected dias = diasHasta;
  protected abs = Math.abs;

  constructor() {
    this.datos.cargar(['pagos', 'bodegas', 'contratos']);
    effect(() => {
      const id = this.pagar();
      if (id) this.abierto.set(id);
    });
  }

  protected abrir(p: Pago): void {
    this.abierto.set(this.abierto() === p.id ? null : p.id);
    this.error.set(null);
    this.recibo.set(null);
  }

  protected async confirmar(p: Pago): Promise<void> {
    this.pagando.set(true);
    this.error.set(null);
    const r = await this.datos.ejecutar(this.api.pagar(p.id, this.metodo()));
    this.pagando.set(false);
    if (r.ok) {
      this.recibo.set(r.valor);
      this.abierto.set(null);
      this.aviso.ok(`Pago de ${p.concepto.toLowerCase()} registrado. Folio ${r.valor.folio}.`);
    } else {
      this.error.set(r.error);
    }
  }
}
