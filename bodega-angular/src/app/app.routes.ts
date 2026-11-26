import { Routes } from '@angular/router';
import { rolGuard } from './core/auth.service';
import { Caracteristicas } from './sitio/caracteristicas/caracteristicas';
import { Contacto } from './sitio/contacto/contacto';
import { Inicio } from './sitio/inicio/inicio';
import { SitioLayout } from './sitio/layout/sitio-layout';
import { Tamanos } from './sitio/tamanos/tamanos';
import { Ubicacion } from './sitio/ubicacion/ubicacion';

export const routes: Routes = [
  // Sitio público (páginas originales)
  {
    path: '',
    component: SitioLayout,
    children: [
      { path: '', component: Inicio, title: 'Bodega Segura Zaachila' },
      { path: 'caracteristicas', component: Caracteristicas, title: 'Características | Bodegas Seguras' },
      { path: 'tamanos', component: Tamanos, title: 'Tamaños de Bodega' },
      { path: 'ubicacion', component: Ubicacion, title: 'Ubicación | Bodegas Seguras Zaachila' },
      { path: 'contacto', component: Contacto, title: 'Contacto | Bodegas Seguras Zaachila' },
    ],
  },

  // Catálogo de los 4 espacios y sus fichas
  {
    path: 'espacios',
    loadComponent: () => import('./espacios/layout/espacios-layout').then((m) => m.EspaciosLayout),
    children: [
      { path: '', loadComponent: () => import('./espacios/catalogo/catalogo').then((m) => m.Catalogo), title: '4 espacios de alquiler | Bodegas Seguras Zaachila' },
      { path: ':slug', loadComponent: () => import('./espacios/detalle/detalle').then((m) => m.Detalle) },
    ],
  },

  { path: 'login', loadComponent: () => import('./auth/login/login').then((m) => m.Login), title: 'Entrar | Bodega Segura Zaachila' },

  // Panel del cliente (quien renta)
  {
    path: 'cliente',
    canActivate: [rolGuard('cliente')],
    loadComponent: () => import('./panel/shell/shell').then((m) => m.Shell),
    data: { rol: 'cliente' },
    children: [
      {
        path: '',
        loadComponent: () => import('./panel/cliente/resumen').then((m) => m.ClienteResumen),
        title: 'Mi bodega | Bodega Segura Zaachila',
        data: { titulo: 'Mi bodega', subtitulo: '' },
      },
      {
        path: 'rentar',
        loadComponent: () => import('./panel/cliente/rentar').then((m) => m.ClienteRentar),
        title: 'Rentar bodega | Bodega Segura Zaachila',
        data: { titulo: 'Rentar una bodega', subtitulo: 'Elige una bodega libre y envía tu solicitud. El dueño la revisa y te responde aquí.' },
      },
      {
        path: 'pagos',
        loadComponent: () => import('./panel/cliente/pagos').then((m) => m.ClientePagos),
        title: 'Pagos | Bodega Segura Zaachila',
        data: { titulo: 'Pagos', subtitulo: 'Tus mensualidades: lo que debes, lo que ya pagaste y tus folios.' },
      },
    ],
  },

  // Panel del dueño
  {
    path: 'dueno',
    canActivate: [rolGuard('dueno')],
    loadComponent: () => import('./panel/shell/shell').then((m) => m.Shell),
    data: { rol: 'dueno' },
    children: [
      {
        path: '',
        loadComponent: () => import('./panel/dueno/resumen').then((m) => m.DuenoResumen),
        title: 'Resumen | Panel del dueño',
        data: { titulo: 'Resumen', subtitulo: 'Tus 4 bodegas, lo que necesita tu atención y cómo va el mes.' },
      },
      {
        path: 'bodegas',
        loadComponent: () => import('./panel/dueno/bodegas').then((m) => m.DuenoBodegas),
        title: 'Bodegas | Panel del dueño',
        data: { titulo: 'Bodegas', subtitulo: 'Cambia el precio, el estado y el cliente de cada bodega. Lo que guardes se ve en el catálogo público.' },
      },
      {
        path: 'solicitudes',
        loadComponent: () => import('./panel/dueno/solicitudes').then((m) => m.DuenoSolicitudes),
        title: 'Solicitudes | Panel del dueño',
        data: { titulo: 'Solicitudes de renta', subtitulo: 'Aprueba para apartar la bodega al cliente, o recházala con un motivo.' },
      },
      {
        path: 'pagos',
        loadComponent: () => import('./panel/dueno/pagos').then((m) => m.DuenoPagos),
        title: 'Pagos | Panel del dueño',
        data: { titulo: 'Pagos e ingresos', subtitulo: 'Mensualidades cobradas, pendientes y vencidas. Registra aquí los pagos en efectivo.' },
      },
      {
        path: 'clientes',
        loadComponent: () => import('./panel/dueno/clientes').then((m) => m.DuenoClientes),
        title: 'Clientes | Panel del dueño',
        data: { titulo: 'Clientes', subtitulo: 'Quién renta, desde cuándo, cómo contactarlo y cuánto debe.' },
      },
    ],
  },

  { path: '**', redirectTo: '' },
];
