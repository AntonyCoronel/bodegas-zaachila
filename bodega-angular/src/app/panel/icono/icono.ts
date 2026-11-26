import { Component, computed, input } from '@angular/core';

/** Íconos de trazo (24×24, trazo 1.8) dibujados para los paneles. Mismo estilo que los de contacto.html. */
const RUTAS: Record<string, string> = {
  resumen: 'M4 11.5 12 5l8 6.5M6 10v9h4.5v-5h3v5H18v-9',
  bodega: 'M3.5 9.5 12 4.5l8.5 5V20h-17zM7.5 20v-7h9v7M7.5 15.5h9M7.5 18h9',
  solicitud: 'M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20V4a.5.5 0 0 1 .5-.5M14 3.5V8h4M9 13h6M12 10v6',
  pagos: 'M3.5 7.5h17v11h-17zM3.5 11h17M7 15.5h3',
  clientes: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7M3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 4.4a3.5 3.5 0 0 1 0 6.2M17.5 15.3c1.9.6 3.1 2.2 3.5 4.7',
  salir: 'M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14M10 8l-4 4 4 4M6 12h9',
  sitio: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5S9.7 5.9 12 3.5',
  llave: 'M14.5 13.5a4.5 4.5 0 1 0-4.1-2.6L4 17.3V20h2.7l.8-.8V17.5h1.7l.8-.8V15h1.7l1.3-1.3c.4.1.9.2 1.5.2M15.8 8.2h.01',
  calendario: 'M4.5 6h15v14h-15zM4.5 10h15M8.5 3.5V7M15.5 3.5V7',
  check: 'M5 12.5 10 17l9-10',
  cerrar: 'M6 6l12 12M18 6 6 18',
  alerta: 'M12 4 2.8 19.5h18.4zM12 10v4.5M12 17.2h.01',
  info: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 11v5.5M12 7.8h.01',
  flecha: 'M5 12h14M13 6l6 6-6 6',
  reloj: 'M12 20.5a8.5 8.5 0 1 0 0-17 8.5 8.5 0 0 0 0 17M12 7.5V12l3 2',
  telefono: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
  correo: 'M3 5h18v14H3zM3.5 6.5 12 13l8.5-6.5',
  ojo: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  ojoNo: 'M3 3l18 18M10.6 5.6c.5-.1.9-.1 1.4-.1 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.6 4.6-1.4M9.9 9.9a3 3 0 0 0 4.2 4.2',
  recargar: 'M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4',
  tarjeta: 'M3.5 6h17v12h-17zM3.5 10h17M7 14.5h4',
  transferencia: 'M4 8.5h15l-4-4M20 15.5H5l4 4',
  efectivo: 'M3 7h18v10H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5M6 10v4M18 10v4',
  usuario: 'M12 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4.5 20.5c.8-3.8 3.7-6 7.5-6s6.7 2.2 7.5 6',
  candado: 'M6 10.5h12v10H6zM8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2.5',
  ubicacion: 'M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5',
  mas: 'M12 5v14M5 12h14',
  buscar: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13M20 20l-4.8-4.8',
};

@Component({
  selector: 'app-icono',
  template: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path [attr.d]="d()" /></svg>`,
  styles: `:host { display: inline-flex; width: 20px; height: 20px; flex: none; } svg { width: 100%; height: 100%; }`,
})
export class Icono {
  readonly nombre = input.required<string>();
  protected d = computed(() => RUTAS[this.nombre()] ?? '');
}
