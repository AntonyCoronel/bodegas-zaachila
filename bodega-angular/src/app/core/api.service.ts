import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api-config';
import {
  Bodega, CambiosBodega, Cliente, Contrato, MetodoPago, NuevaSolicitud, Pago, Sesion, Solicitud, Usuario,
} from './models';

/** Todas las llamadas al backend pasan por aquí. Las rutas están documentadas en API.md. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private url = (ruta: string) => `${API_CONFIG.baseUrl}${ruta}`;

  login(correo: string, password: string): Observable<Sesion> {
    return this.http.post<Sesion>(this.url('/auth/login'), { correo, password });
  }
  registro(datos: { nombre: string; correo: string; telefono: string; password: string }): Observable<Sesion> {
    return this.http.post<Sesion>(this.url('/auth/registro'), datos);
  }
  yo(): Observable<Usuario> {
    return this.http.get<Usuario>(this.url('/auth/yo'));
  }

  bodegas(): Observable<Bodega[]> {
    return this.http.get<Bodega[]>(this.url('/bodegas'));
  }
  editarBodega(id: string, cambios: CambiosBodega): Observable<Bodega> {
    return this.http.patch<Bodega>(this.url(`/bodegas/${id}`), cambios);
  }

  solicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(this.url('/solicitudes'));
  }
  crearSolicitud(datos: NuevaSolicitud): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.url('/solicitudes'), datos);
  }
  aprobarSolicitud(id: string, respuesta = ''): Observable<{ solicitud: Solicitud; contrato: Contrato }> {
    return this.http.post<{ solicitud: Solicitud; contrato: Contrato }>(this.url(`/solicitudes/${id}/aprobar`), { respuesta });
  }
  rechazarSolicitud(id: string, respuesta: string): Observable<{ solicitud: Solicitud }> {
    return this.http.post<{ solicitud: Solicitud }>(this.url(`/solicitudes/${id}/rechazar`), { respuesta });
  }

  contratos(): Observable<Contrato[]> {
    return this.http.get<Contrato[]>(this.url('/contratos'));
  }
  activarContrato(id: string): Observable<Contrato> {
    return this.http.post<Contrato>(this.url(`/contratos/${id}/activar`), {});
  }
  finalizarContrato(id: string): Observable<Contrato> {
    return this.http.post<Contrato>(this.url(`/contratos/${id}/finalizar`), {});
  }

  pagos(): Observable<Pago[]> {
    return this.http.get<Pago[]>(this.url('/pagos'));
  }
  pagar(id: string, metodo: MetodoPago): Observable<Pago> {
    return this.http.post<Pago>(this.url(`/pagos/${id}/pagar`), { metodo });
  }

  clientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(this.url('/clientes'));
  }

  reiniciarDemo(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(this.url('/demo/reiniciar'), {});
  }
}

/** Convierte cualquier error HTTP en un mensaje para mostrar. */
export function mensajeDeError(e: unknown): string {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return 'No hay conexión con el servidor. Revisa que el backend esté encendido.';
    const mensaje = (e.error as { mensaje?: string } | null)?.mensaje;
    if (mensaje) return mensaje;
    return `El servidor respondió con un error (${e.status}).`;
  }
  return 'Ocurrió un error inesperado.';
}
