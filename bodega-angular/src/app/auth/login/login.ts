import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { mensajeDeError } from '../../core/api.service';
import { API_CONFIG } from '../../core/api-config';
import { AuthService } from '../../core/auth.service';
import { DatosService } from '../../core/datos.service';
import { Icono } from '../../panel/icono/icono';

/** Entrar o crear cuenta. Cada rol entra a su panel. */
@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, Icono],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  /** ?volver=/cliente/rentar regresa a donde estaba después de entrar. */
  readonly volver = input<string | undefined>();
  /** ?rol=cliente | dueno viene del selector de la página principal. */
  readonly rol = input<string | undefined>();
  protected rolElegido = computed(() => (this.rol() === 'dueno' || this.rol() === 'cliente' ? this.rol() : null) as 'cliente' | 'dueno' | null);

  private auth = inject(AuthService);
  private datos = inject(DatosService);
  private router = inject(Router);

  protected modo = signal<'entrar' | 'registro'>('entrar');
  protected enviando = signal(false);
  protected error = signal<string | null>(null);
  protected verPassword = signal(false);
  protected readonly demo = API_CONFIG.useMockBackend;

  protected correo = '';
  protected password = '';
  protected nombre = '';
  protected telefono = '';

  protected cambiarModo(m: 'entrar' | 'registro'): void {
    this.modo.set(m);
    this.error.set(null);
  }

  protected usarDemo(correo: string): void {
    this.modo.set('entrar');
    this.correo = correo;
    this.password = 'demo123';
    this.enviar();
  }

  protected enviar(): void {
    this.error.set(null);
    if (this.modo() === 'registro' && this.password.length < 6) {
      this.error.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    this.enviando.set(true);
    const peticion =
      this.modo() === 'entrar'
        ? this.auth.login(this.correo, this.password)
        : this.auth.registro({ nombre: this.nombre, correo: this.correo, telefono: this.telefono, password: this.password });
    peticion.subscribe({
      next: (s) => {
        this.enviando.set(false);
        this.datos.limpiar();
        const destino = this.volver();
        const permitido = destino && destino.startsWith(s.usuario.rol === 'dueno' ? '/dueno' : '/cliente');
        this.router.navigateByUrl(permitido ? destino! : this.auth.panelDe(s.usuario.rol));
      },
      error: (e) => {
        this.enviando.set(false);
        this.error.set(mensajeDeError(e));
      },
    });
  }
}
