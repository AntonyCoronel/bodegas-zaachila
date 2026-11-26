import { HttpInterceptorFn } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { Rol, Sesion } from './models';

const SESION_KEY = 'bodegaSegura.sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private sesion = signal<Sesion | null>(leerSesion());

  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly token = computed(() => this.sesion()?.token ?? null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);

  login(correo: string, password: string): Observable<Sesion> {
    return this.api.login(correo, password).pipe(tap((s) => this.guardar(s)));
  }

  registro(datos: { nombre: string; correo: string; telefono: string; password: string }): Observable<Sesion> {
    return this.api.registro(datos).pipe(tap((s) => this.guardar(s)));
  }

  logout(): void {
    this.guardar(null);
    this.router.navigateByUrl('/login');
  }

  /** Ruta de inicio del panel según el rol. */
  panelDe(rol: Rol | null = this.rol()): string {
    return rol === 'dueno' ? '/dueno' : rol === 'cliente' ? '/cliente' : '/login';
  }

  private guardar(s: Sesion | null): void {
    this.sesion.set(s);
    try {
      if (s) localStorage.setItem(SESION_KEY, JSON.stringify(s));
      else localStorage.removeItem(SESION_KEY);
    } catch {
      /* sin almacenamiento: la sesión dura hasta recargar */
    }
  }
}

function leerSesion(): Sesion | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESION_KEY) ?? 'null') as Sesion | null;
    return s?.token && s.usuario ? s : null;
  } catch {
    return null;
  }
}

/** Agrega el token a cada petición al backend. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  return next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
};

/** Protege las rutas de cada panel según el rol. */
export function rolGuard(rol: Rol): CanActivateFn {
  return (_route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const actual = auth.rol();
    if (actual === rol) return true;
    if (actual) return router.parseUrl(auth.panelDe(actual));
    return router.createUrlTree(['/login'], { queryParams: { volver: state.url } });
  };
}
