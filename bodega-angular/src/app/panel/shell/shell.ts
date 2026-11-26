import { Component, computed, inject, input, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { API_CONFIG } from '../../core/api-config';
import { AuthService } from '../../core/auth.service';
import { AvisoService } from '../../core/aviso.service';
import { DatosService } from '../../core/datos.service';
import { Rol } from '../../core/models';
import { Icono } from '../icono/icono';

interface Enlace {
  ruta: string;
  texto: string;
  icono: string;
  exacto?: boolean;
}

const MENUS: Record<Rol, Enlace[]> = {
  cliente: [
    { ruta: '/cliente', texto: 'Mi bodega', icono: 'resumen', exacto: true },
    { ruta: '/cliente/rentar', texto: 'Rentar bodega', icono: 'bodega' },
    { ruta: '/cliente/pagos', texto: 'Pagos', icono: 'pagos' },
  ],
  dueno: [
    { ruta: '/dueno', texto: 'Resumen', icono: 'resumen', exacto: true },
    { ruta: '/dueno/bodegas', texto: 'Bodegas', icono: 'bodega' },
    { ruta: '/dueno/solicitudes', texto: 'Solicitudes', icono: 'solicitud' },
    { ruta: '/dueno/pagos', texto: 'Pagos', icono: 'pagos' },
    { ruta: '/dueno/clientes', texto: 'Clientes', icono: 'clientes' },
  ],
};

/** Marco común de los dos paneles: barra lateral azul marino, encabezado y contenido. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Icono],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell implements OnDestroy {
  /** Viene de data: { rol } en la ruta. */
  readonly rol = input.required<Rol>();

  protected auth = inject(AuthService);
  protected aviso = inject(AvisoService);
  protected datos = inject(DatosService);
  private api = inject(ApiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected readonly demo = API_CONFIG.useMockBackend;

  protected menu = computed(() => MENUS[this.rol()]);
  protected etiquetaRol = computed(() => (this.rol() === 'dueno' ? 'Panel del dueño' : 'Panel del cliente'));
  protected iniciales = computed(() =>
    (this.auth.usuario()?.nombre ?? '')
      .replace(/\(.*?\)/g, '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join(''),
  );

  /** Título y subtítulo de la página actual (definidos en data de cada ruta hija). */
  private datosRuta = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map(() => this.hojaActual()),
    ),
    { initialValue: this.hojaActual() },
  );
  protected titulo = computed(() => (this.datosRuta()['titulo'] as string) ?? '');
  protected subtitulo = computed(() => (this.datosRuta()['subtitulo'] as string) ?? '');

  protected hoy = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

  private hojaActual(): Record<string, unknown> {
    let r = this.route;
    while (r.firstChild) r = r.firstChild;
    // Durante la primera activación la ruta hija aún no tiene snapshot.
    return r.snapshot?.data ?? {};
  }

  /** Solo con el backend simulado: vuelve a los datos de ejemplo iniciales. */
  protected async reiniciar(): Promise<void> {
    const r = await this.datos.ejecutar(this.api.reiniciarDemo());
    if (r.ok) this.aviso.ok('Se restauraron los datos de ejemplo.');
    else this.aviso.error(r.error);
  }

  protected salir(): void {
    this.datos.limpiar();
    this.auth.logout();
  }

  ngOnDestroy(): void {
    this.aviso.cerrar();
  }
}
