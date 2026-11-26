import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';

/** Menú superior del sitio (el mismo de todas las páginas originales) + la página actual. */
@Component({
  selector: 'app-sitio-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sitio-layout.html',
  styleUrl: './sitio-layout.css',
})
export class SitioLayout {
  private auth = inject(AuthService);
  protected cuenta = computed(() => (this.auth.usuario() ? 'Mi panel' : 'Mi cuenta'));
  protected rutaCuenta = computed(() => this.auth.panelDe());
}
