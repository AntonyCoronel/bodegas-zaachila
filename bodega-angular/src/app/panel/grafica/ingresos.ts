import { Component, computed, input, signal } from '@angular/core';
import { dinero, mes, mesCorto } from '../../core/formato';

export interface PuntoIngreso {
  periodo: string; // AAAA-MM
  monto: number;
  pagos: number;
}

const ALTO = 180;
const ARRIBA = 18;
const ABAJO = 26;
const IZQ = 48;

/** Suma lo cobrado por mes (según la fecha de pago) en los últimos `n` meses, terminando en el actual. */
export function ingresosPorMes(pagos: { estado: string; pagadoEn: string | null; monto: number }[], n = 6): PuntoIngreso[] {
  const hoy = new Date();
  const meses: PuntoIngreso[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push({ periodo: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, monto: 0, pagos: 0 });
  }
  for (const p of pagos) {
    if (p.estado !== 'Pagado' || !p.pagadoEn) continue;
    const m = meses.find((x) => x.periodo === p.pagadoEn!.slice(0, 7));
    if (m) {
      m.monto += p.monto;
      m.pagos += 1;
    }
  }
  return meses;
}

/** Barras de ingresos cobrados por mes. Una sola serie: el título la nombra, sin leyenda. */
@Component({
  selector: 'app-grafica-ingresos',
  template: `
    <div class="grafica" (mouseleave)="activo.set(null)">
      <svg [attr.viewBox]="'0 0 ' + ancho + ' ' + ALTO" role="group" [attr.aria-label]="resumenAria()">
        @for (t of marcas(); track t.valor) {
          <line class="rejilla" [attr.x1]="IZQ" [attr.x2]="ancho" [attr.y1]="t.y" [attr.y2]="t.y" />
          <text class="eje" [attr.x]="IZQ - 8" [attr.y]="t.y + 4" text-anchor="end">{{ t.etiqueta }}</text>
        }
        @for (b of barras(); track b.periodo; let i = $index) {
          <g class="columna" [class.activa]="activo() === i" tabindex="0" role="img"
             [attr.aria-label]="b.aria" (mouseenter)="activo.set(i)" (focus)="activo.set(i)" (blur)="activo.set(null)">
            <rect class="zona" [attr.x]="b.slotX" [attr.y]="ARRIBA" [attr.width]="b.slotW" [attr.height]="ALTO - ARRIBA - ABAJO + 4" />
            @if (b.h > 0) {
              <path class="barra" [class.actual]="b.actual" [attr.d]="b.d" />
            }
            @if (b.actual && b.h > 0) {
              <text class="valor" [attr.x]="b.cx" [attr.y]="b.y - 7" text-anchor="middle">{{ b.texto }}</text>
            }
            <text class="eje mes" [attr.x]="b.cx" [attr.y]="ALTO - 8" text-anchor="middle">{{ b.mes }}</text>
          </g>
        }
        <line class="base" [attr.x1]="IZQ" [attr.x2]="ancho" [attr.y1]="ALTO - ABAJO" [attr.y2]="ALTO - ABAJO" />
      </svg>
      @if (activo() !== null) {
        @let b = barras()[activo()!];
        <div class="tip" [style.left.%]="(b.cx / ancho) * 100" [style.top.%]="(Math.min(b.y, ALTO - ABAJO - 4) / ALTO) * 100">
          <strong>{{ b.texto }}</strong>
          <span>{{ b.nombreMes }} · {{ b.pagos }} {{ b.pagos === 1 ? 'pago' : 'pagos' }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .grafica { position: relative; }
    svg { display: block; width: 100%; height: auto; overflow: visible; font-family: Arial, Helvetica, sans-serif; }
    .rejilla { stroke: #f1e8dc; stroke-width: 1; }
    .base { stroke: #d9cbbb; stroke-width: 1; }
    .eje { fill: #6f6260; font-size: 11px; }
    .mes { font-size: 12px; }
    .columna { outline: none; cursor: default; }
    .zona { fill: transparent; }
    .columna.activa .zona, .columna:focus-visible .zona { fill: #fff6ea; }
    .barra { fill: #c42b34; transition: fill 0.15s ease; }
    .columna.activa .barra { fill: #a3222a; }
    .valor { fill: #422b2b; font-size: 12px; font-weight: 700; }
    .tip {
      position: absolute;
      transform: translate(-50%, calc(-100% - 10px));
      display: grid;
      gap: 2px;
      padding: 8px 11px;
      border-radius: 9px;
      background: #101b2d;
      color: #fff;
      font-size: 12px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 8px 20px rgba(16, 27, 45, 0.25);
    }
    .tip strong { font-size: 14px; }
    .tip span { color: #c4ccd9; }
  `,
})
export class GraficaIngresos {
  readonly datos = input.required<PuntoIngreso[]>();

  protected readonly ALTO = ALTO;
  protected readonly ARRIBA = ARRIBA;
  protected readonly ABAJO = ABAJO;
  protected readonly IZQ = IZQ;
  protected readonly ancho = 560;
  protected readonly Math = Math;
  protected activo = signal<number | null>(null);

  private maximo = computed(() => {
    const max = Math.max(0, ...this.datos().map((d) => d.monto));
    if (max === 0) return 1000;
    const paso = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / (paso / 2)) * (paso / 2);
  });

  private y = (v: number) => ALTO - ABAJO - (v / this.maximo()) * (ALTO - ARRIBA - ABAJO);

  protected marcas = computed(() => {
    const max = this.maximo();
    return [0, max / 2, max].map((valor) => ({ valor, y: this.y(valor), etiqueta: valor === 0 ? '$0' : `$${(valor / 1000).toLocaleString('es-MX', { maximumFractionDigits: 1 })}k` }));
  });

  protected barras = computed(() => {
    const d = this.datos();
    const slotW = (this.ancho - IZQ) / Math.max(1, d.length);
    const w = Math.min(24, slotW * 0.45);
    return d.map((p, i) => {
      const cx = IZQ + slotW * i + slotW / 2;
      const y = this.y(p.monto);
      const h = ALTO - ABAJO - y;
      const r = Math.min(4, h);
      const x = cx - w / 2;
      const base = ALTO - ABAJO;
      return {
        periodo: p.periodo,
        cx, y, h, slotX: IZQ + slotW * i, slotW,
        actual: i === d.length - 1,
        d: `M ${x} ${base} V ${y + r} Q ${x} ${y} ${x + r} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${base} Z`,
        texto: dinero(p.monto),
        mes: mesCorto(p.periodo),
        nombreMes: mes(p.periodo),
        pagos: p.pagos,
        aria: `${mes(p.periodo)}: ${dinero(p.monto)} cobrados en ${p.pagos} ${p.pagos === 1 ? 'pago' : 'pagos'}`,
      };
    });
  });

  protected resumenAria = computed(() => `Ingresos cobrados por mes. ${this.barras().map((b) => b.aria).join('. ')}.`);
}
