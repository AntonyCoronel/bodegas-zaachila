import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService, mensajeDeError } from '../../core/api.service';
import { DineroPipe } from '../../core/formato';
import { fotoReferencia } from '../../core/imagenes';
import { Bodega } from '../../core/models';

/** Catálogo de los 4 espacios (proyecto/espacios/index.html). Los datos llegan de GET /api/bodegas. */
@Component({
  selector: 'app-catalogo',
  imports: [RouterLink, DineroPipe],
  templateUrl: './catalogo.html',
  styleUrls: ['../espacios.css', './catalogo.css'],
})
export class Catalogo implements OnInit {
  private api = inject(ApiService);
  protected bodegas = signal<Bodega[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);
  protected disponibles = computed(() => this.bodegas().filter((b) => b.estado === 'Disponible').length);
  protected foto = fotoReferencia;

  async ngOnInit(): Promise<void> {
    try {
      this.bodegas.set(await firstValueFrom(this.api.bodegas()));
    } catch (e) {
      this.error.set(mensajeDeError(e));
    } finally {
      this.cargando.set(false);
    }
  }
}
