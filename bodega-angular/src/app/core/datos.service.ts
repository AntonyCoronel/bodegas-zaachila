import { inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ApiService, mensajeDeError } from './api.service';
import { Bodega, Cliente, Contrato, Pago, Solicitud } from './models';

type Coleccion = 'bodegas' | 'solicitudes' | 'contratos' | 'pagos' | 'clientes';

/**
 * Estado compartido de los paneles. Cada pantalla pide las colecciones que usa
 * y, después de cada cambio, se vuelven a pedir al backend para no desincronizarse.
 */
@Injectable({ providedIn: 'root' })
export class DatosService {
  private api = inject(ApiService);

  readonly bodegas = signal<Bodega[]>([]);
  readonly solicitudes = signal<Solicitud[]>([]);
  readonly contratos = signal<Contrato[]>([]);
  readonly pagos = signal<Pago[]>([]);
  readonly clientes = signal<Cliente[]>([]);

  readonly cargando = signal(false);
  readonly listo = signal(false);
  readonly error = signal<string | null>(null);

  private ultimas: Coleccion[] = [];

  async cargar(colecciones: Coleccion[]): Promise<void> {
    this.ultimas = colecciones;
    this.cargando.set(true);
    this.error.set(null);
    try {
      await Promise.all(colecciones.map((c) => this.cargarUna(c)));
      this.listo.set(true);
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  recargar(): Promise<void> {
    return this.cargar(this.ultimas);
  }

  /** Ejecuta un cambio y recarga los datos. Devuelve el mensaje de error, o null si salió bien. */
  async ejecutar<T>(accion: Observable<T>): Promise<{ ok: true; valor: T } | { ok: false; error: string }> {
    try {
      const valor = await firstValueFrom(accion);
      await this.recargar();
      return { ok: true, valor };
    } catch (e) {
      return { ok: false, error: mensajeDeError(e) };
    }
  }

  limpiar(): void {
    this.bodegas.set([]);
    this.solicitudes.set([]);
    this.contratos.set([]);
    this.pagos.set([]);
    this.clientes.set([]);
    this.listo.set(false);
  }

  private async cargarUna(c: Coleccion): Promise<void> {
    switch (c) {
      case 'bodegas': this.bodegas.set(await firstValueFrom(this.api.bodegas())); break;
      case 'solicitudes': this.solicitudes.set(await firstValueFrom(this.api.solicitudes())); break;
      case 'contratos': this.contratos.set(await firstValueFrom(this.api.contratos())); break;
      case 'pagos': this.pagos.set(await firstValueFrom(this.api.pagos())); break;
      case 'clientes': this.clientes.set(await firstValueFrom(this.api.clientes())); break;
    }
  }
}
