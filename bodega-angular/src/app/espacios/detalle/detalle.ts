import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, mensajeDeError } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { DineroPipe } from '../../core/formato';
import { fotoInterior, fotoReferencia } from '../../core/imagenes';
import { Bodega, Cliente, EstadoBodega } from '../../core/models';

/** Ficha individual de cada espacio (espacio-pequeno.html, espacio-mediano.html, ...). */
@Component({
  selector: 'app-detalle',
  imports: [RouterLink, FormsModule, DineroPipe],
  templateUrl: './detalle.html',
  styleUrls: ['../espacios.css', './detalle.css'],
})
export class Detalle {
  /** Viene de la ruta /espacios/:slug */
  readonly slug = input.required<string>();

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private title = inject(Title);

  protected bodegas = signal<Bodega[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected bodega = computed(() => this.bodegas().find((b) => b.slug === this.slug()) ?? null);
  protected esDueno = computed(() => this.auth.rol() === 'dueno');

  protected foto = signal<'interior' | 'referencia'>('interior');
  protected editando = signal(false);
  protected guardando = signal(false);
  protected aviso = signal<string | null>(null);
  protected clientes = signal<Cliente[]>([]);

  // Campos del formulario de edición (solo dueño)
  protected precio = 0;
  protected estado: EstadoBodega = 'Disponible';
  protected clienteId = '';

  protected fotoInterior = fotoInterior;
  protected fotoReferencia = fotoReferencia;

  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    this.cargar();
    effect(() => {
      const b = this.bodega();
      this.title.setTitle(b ? `${b.titulo} | Bodegas Seguras Zaachila` : '4 espacios de alquiler | Bodegas Seguras Zaachila');
    });
    // Al cambiar de ficha se reinicia la vista.
    effect(() => {
      this.slug();
      this.foto.set('interior');
      this.editando.set(false);
    });
  }

  private async cargar(): Promise<void> {
    try {
      this.bodegas.set(await firstValueFrom(this.api.bodegas()));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }

  protected clienteVisible(b: Bodega): string {
    if (b.estado === 'Disponible') return 'Sin cliente';
    return b.clienteNombre ?? 'Asignado (privado)';
  }

  protected async abrirEdicion(): Promise<void> {
    const b = this.bodega();
    if (!b) return;
    this.precio = b.precio;
    this.estado = b.estado;
    this.clienteId = b.clienteId ?? '';
    this.editando.set(true);
    if (!this.clientes().length) {
      try {
        this.clientes.set(await firstValueFrom(this.api.clientes()));
      } catch (e) {
        this.notificar(mensajeDeError(e));
      }
    }
    setTimeout(() => document.getElementById('edit-form')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }));
  }

  protected async guardar(): Promise<void> {
    const b = this.bodega();
    if (!b) return;
    if (!Number.isFinite(this.precio) || this.precio <= 0) return this.notificar('Introduce un precio válido');
    if (this.estado !== 'Disponible' && !this.clienteId) return this.notificar('Asigna un cliente para reservar u ocupar la bodega');
    this.guardando.set(true);
    try {
      const nueva = await firstValueFrom(
        this.api.editarBodega(b.id, { precio: this.precio, estado: this.estado, clienteId: this.estado === 'Disponible' ? null : this.clienteId }),
      );
      this.bodegas.update((lista) => lista.map((x) => (x.id === nueva.id ? nueva : x)));
      this.editando.set(false);
      this.notificar('Datos de la bodega actualizados');
    } catch (e) {
      this.notificar(mensajeDeError(e));
    } finally {
      this.guardando.set(false);
    }
  }

  protected solicitar(b: Bodega): void {
    this.router.navigate(['/cliente/rentar'], { queryParams: { bodega: b.id } });
  }

  private notificar(msg: string): void {
    this.aviso.set(msg);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.aviso.set(null), 3600);
  }
}
