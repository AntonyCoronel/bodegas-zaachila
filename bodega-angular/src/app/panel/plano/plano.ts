import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { Bodega } from '../../core/models';

interface Linea {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Unidad {
  b: Bodega;
  x: number;
  y: number;
  w: number;
  h: number;
  puerta: Linea;
  cortina: Linea;
  propia: boolean;
  elegible: boolean;
  etiqueta: string;
  nombre: string | null;
  aria: string;
}

const ESCALA = 10; // unidades del SVG por metro
const PASILLO = 18; // 1.8 m
// Horizontal (pantallas anchas): pasillo arriba, bodegas una junto a otra hacia abajo.
const H_IZQ = 22;
const H_MARGEN = 8;
// Vertical (celular): pasillo a la izquierda, bodegas apiladas hacia la derecha.
const V_MARGEN = 6;
const V_ARRIBA = 14;

/**
 * Plano de las 4 bodegas dibujado a escala (1 m = 10 unidades).
 * Las bodegas están una junto a otra sobre el pasillo de carga; su tamaño en el dibujo
 * corresponde a sus medidas reales y el color a su estado. En pantallas angostas
 * el plano se gira para que quepa sin desplazarse de lado.
 */
@Component({
  selector: 'app-plano',
  templateUrl: './plano.html',
  styleUrl: './plano.css',
})
export class Plano {
  readonly bodegas = input.required<Bodega[]>();
  /** dueño: ve estado y cliente de todas. cliente: ve la suya y cuáles están libres. */
  readonly modo = input<'dueno' | 'cliente'>('dueno');
  readonly miBodegaId = input<string | null>(null);
  readonly seleccion = input<string | null>(null);
  readonly elegir = output<string>();

  protected vertical = signal(false);

  constructor() {
    const mq = window.matchMedia('(max-width: 600px)');
    this.vertical.set(mq.matches);
    const alCambiar = (e: MediaQueryListEvent) => this.vertical.set(e.matches);
    mq.addEventListener('change', alCambiar);
    inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', alCambiar));
  }

  private ordenadas = computed(() => [...this.bodegas()].sort((a, b) => a.m2 - b.m2));
  protected largo = computed(() => this.ordenadas().reduce((s, b) => s + b.ancho * ESCALA, 0));
  protected profundo = computed(() => Math.max(0, ...this.ordenadas().map((b) => b.fondo * ESCALA)));

  /** Rectángulo del pasillo y posición de sus textos. */
  protected pasillo = computed(() =>
    this.vertical()
      ? { x: V_MARGEN, y: V_ARRIBA, w: PASILLO, h: this.largo() }
      : { x: H_IZQ, y: H_MARGEN, w: this.largo(), h: PASILLO },
  );

  protected unidades = computed<Unidad[]>(() => {
    const vertical = this.vertical();
    const modo = this.modo();
    let avance = 0;
    return this.ordenadas().map((b) => {
      const frente = b.ancho * ESCALA;
      const fondo = b.fondo * ESCALA;
      const propia = b.id === this.miBodegaId();
      const elegible = modo === 'dueno' || propia || b.estado === 'Disponible';
      const pw = Math.min(frente - 6, 14);
      let u: Pick<Unidad, 'x' | 'y' | 'w' | 'h' | 'puerta' | 'cortina'>;
      if (vertical) {
        const x = V_MARGEN + PASILLO;
        const y = V_ARRIBA + avance;
        const p1 = y + (frente - pw) / 2;
        const p2 = y + (frente + pw) / 2;
        u = { x, y, w: fondo, h: frente, puerta: { x1: x, y1: p1, x2: x, y2: p2 }, cortina: { x1: x + 1.6, y1: p1, x2: x + 1.6, y2: p2 } };
      } else {
        const x = H_IZQ + avance;
        const y = H_MARGEN + PASILLO;
        const p1 = x + (frente - pw) / 2;
        const p2 = x + (frente + pw) / 2;
        u = { x, y, w: frente, h: fondo, puerta: { x1: p1, y1: y, x2: p2, y2: y }, cortina: { x1: p1, y1: y + 1.6, x2: p2, y2: y + 1.6 } };
      }
      avance += frente;
      return {
        b,
        ...u,
        propia,
        elegible,
        etiqueta: this.etiqueta(b, propia),
        nombre: modo === 'dueno' && b.clienteNombre ? this.recortar(b.clienteNombre.replace(/\s*\(ejemplo\)/i, ''), u.w, vertical) : null,
        aria: this.aria(b, propia),
      };
    });
  });

  protected viewBox = computed(() =>
    this.vertical()
      ? `0 0 ${V_MARGEN + PASILLO + this.profundo() + V_MARGEN} ${V_ARRIBA + this.largo() + 16}`
      : `0 0 ${H_IZQ + this.largo() + H_MARGEN} ${H_MARGEN + PASILLO + this.profundo() + 20}`,
  );

  /** Contorno del edificio: sigue el pasillo y el fondo escalonado de cada bodega, dejando la entrada abierta. */
  protected contorno = computed(() => {
    const us = this.unidades();
    if (!us.length) return '';
    if (this.vertical()) {
      const top = V_ARRIBA;
      let d = `M ${V_MARGEN + 13} ${top}`;
      for (const u of us) d += ` H ${u.x + u.w} V ${u.y + u.h}`;
      d += ` H ${V_MARGEN} V ${top} H ${V_MARGEN + 5}`;
      return d;
    }
    const top = H_MARGEN;
    let d = `M ${H_IZQ} ${top + 13} V ${top + PASILLO}`;
    for (const u of us) d += ` V ${u.y + u.h} H ${u.x + u.w}`;
    d += ` V ${top} H ${H_IZQ} V ${top + 5}`;
    return d;
  });

  protected escala = computed(() =>
    this.vertical() ? { x: V_MARGEN, y: V_ARRIBA + this.largo() + 6 } : { x: H_IZQ, y: H_MARGEN + PASILLO + this.profundo() + 11 },
  );

  protected tecla(e: KeyboardEvent, u: Unidad): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (u.elegible) this.elegir.emit(u.b.id);
    }
  }

  private etiqueta(b: Bodega, propia: boolean): string {
    if (this.modo() === 'cliente') {
      if (propia) return 'Tu bodega';
      return b.estado === 'Disponible' ? 'Disponible' : 'No disponible';
    }
    return b.estado;
  }

  private aria(b: Bodega, propia: boolean): string {
    const base = `${b.titulo}, ${b.id}, ${b.dimensiones}, ${b.m2} metros cuadrados`;
    if (this.modo() === 'cliente') {
      if (propia) return `${base}. Es tu bodega.`;
      return `${base}. ${b.estado === 'Disponible' ? 'Disponible, puedes solicitarla.' : 'No disponible.'}`;
    }
    return `${base}. ${b.estado}${b.clienteNombre ? `, ${b.clienteNombre}` : ''}.`;
  }

  private recortar(texto: string, w: number, vertical: boolean): string {
    const max = Math.floor((w - 5) / (vertical ? 2 : 1.6));
    return texto.length > max ? `${texto.slice(0, Math.max(1, max - 1))}…` : texto;
  }
}
