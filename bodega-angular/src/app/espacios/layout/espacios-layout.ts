import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/** Encabezado y pie del catálogo de los 4 espacios (proyecto/espacios/index.html). */
@Component({
  selector: 'app-espacios-layout',
  imports: [RouterOutlet, RouterLink],
  template: `
    <header class="site-header">
      <div class="container header-inner">
        <a routerLink="/espacios" class="brand" aria-label="Bodegas Seguras, ver catálogo">
          <img class="brand-logo" src="img/logo.jpeg" alt="Bodegas Seguras Zaachila">
        </a>
        <nav class="header-links" aria-label="Principal">
          <a routerLink="/">Inicio</a>
          <a routerLink="/espacios">Los 4 espacios</a>
          <a [routerLink]="rutaCuenta()">{{ cuenta() }}</a>
          <a class="header-cta" routerLink="/espacios">Ver catálogo →</a>
        </nav>
      </div>
    </header>
    <main class="container">
      <router-outlet />
    </main>
    <footer class="footer">Bodegas Seguras Zaachila · Prototipo de demostración. Precios, clientes, disponibilidad y fotografías ilustrativos.</footer>
  `,
  styleUrl: '../espacios.css',
})
export class EspaciosLayout {
  private auth = inject(AuthService);
  protected cuenta = computed(() => (this.auth.usuario() ? 'Mi panel' : 'Mi cuenta'));
  protected rutaCuenta = computed(() => this.auth.panelDe());
}
