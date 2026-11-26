import { Injectable, signal } from '@angular/core';

export interface Aviso {
  texto: string;
  tipo: 'ok' | 'error';
}

/** Mensajes breves (toasts) que confirman una acción o explican un error. */
@Injectable({ providedIn: 'root' })
export class AvisoService {
  readonly actual = signal<Aviso | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  ok(texto: string): void {
    this.mostrar({ texto, tipo: 'ok' });
  }

  error(texto: string): void {
    this.mostrar({ texto, tipo: 'error' });
  }

  cerrar(): void {
    this.actual.set(null);
  }

  private mostrar(aviso: Aviso): void {
    this.actual.set(aviso);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.actual.set(null), aviso.tipo === 'error' ? 6000 : 3600);
  }
}
