import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Rol } from '../../core/models';
import { Icono } from '../../panel/icono/icono';

/** Página principal (index.html original) + selector de tipo de cuenta en la primera pantalla. */
@Component({
  selector: 'app-inicio',
  imports: [RouterLink, Icono],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css',
})
export class Inicio {
  private auth = inject(AuthService);
  private router = inject(Router);

  protected usuario = this.auth.usuario;
  protected rol = this.auth.rol;
  protected primerNombre = computed(() => (this.usuario()?.nombre ?? '').replace(/\s*\(.*?\)/, '').split(' ')[0]);

  /** Si ya tiene sesión con ese rol va directo a su panel; si no, a entrar con ese tipo de cuenta. */
  protected elegir(rol: Rol): void {
    if (this.auth.rol() === rol) this.router.navigateByUrl(this.auth.panelDe(rol));
    else this.router.navigate(['/login'], { queryParams: { rol } });
  }
}
