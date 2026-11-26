import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatosService } from '../../core/datos.service';
import { DineroPipe, FechaPipe } from '../../core/formato';
import { Icono } from '../icono/icono';

/** Lista de clientes con su bodega, su contrato y su saldo. */
@Component({
  selector: 'app-dueno-clientes',
  imports: [FormsModule, RouterLink, Icono, DineroPipe, FechaPipe],
  template: `
    @if (!datos.listo()) {
      <div class="d-card" aria-busy="true"><div class="esqueleto" style="height: 320px"></div></div>
    } @else {
      <section class="d-card" aria-labelledby="t-clientes">
        <div class="d-card-head cabeza">
          <h2 id="t-clientes">{{ filas().length }} {{ filas().length === 1 ? 'cliente' : 'clientes' }}</h2>
          <label class="buscar">
            <app-icono nombre="buscar" />
            <input type="search" placeholder="Buscar por nombre o correo" [ngModel]="busqueda()" (ngModelChange)="busqueda.set($event)" aria-label="Buscar clientes">
          </label>
        </div>
        <div class="tabla-wrap">
          <table class="d-tabla">
            <thead><tr><th>Cliente</th><th>Contacto</th><th>Bodega</th><th>Contrato</th><th class="num">Saldo</th><th class="num">Pagado</th></tr></thead>
            <tbody>
              @for (f of filas(); track f.c.id) {
                <tr>
                  <td><span class="fuerte">{{ f.c.nombre }}</span><div class="tenue">Cliente desde {{ f.c.registradoEn | fecha }}</div></td>
                  <td>
                    <a class="enlace" [href]="'tel:' + f.c.telefono.replaceAll(' ', '')">{{ f.c.telefono }}</a>
                    <div><a class="enlace tenue" [href]="'mailto:' + f.c.correo">{{ f.c.correo }}</a></div>
                  </td>
                  <td>
                    @if (f.contrato) {
                      <a class="enlace" routerLink="/dueno/bodegas" [queryParams]="{ id: f.contrato.bodegaId }"><span class="codigo">{{ f.contrato.bodegaId }}</span></a>
                      <div class="tenue">{{ nombreBodega(f.contrato.bodegaId) }}</div>
                    } @else {
                      <span class="tenue">{{ f.pendientes ? 'Solicitud pendiente' : 'Sin bodega' }}</span>
                    }
                  </td>
                  <td>
                    @if (f.contrato) {
                      <span class="pill" [class]="f.contrato.estado">{{ f.contrato.estado }}</span>
                      <div class="tenue">{{ f.contrato.inicio | fecha }} – {{ f.contrato.fin | fecha }}</div>
                    } @else if (f.ultimo) {
                      <span class="pill Finalizado">Finalizado</span>
                      <div class="tenue">terminó {{ f.ultimo.fin | fecha }}</div>
                    } @else { <span class="tenue">—</span> }
                  </td>
                  <td class="num"><span class="fuerte" [class.rojo]="f.vencido">{{ f.saldo | dinero }}</span>@if (f.vencido) { <div class="tenue rojo">con vencidos</div> }</td>
                  <td class="num tenue">{{ f.pagado | dinero }}</td>
                </tr>
              } @empty {
                <tr><td colspan="6"><div class="vacio"><strong>Sin resultados</strong><p>Nadie coincide con «{{ busqueda() }}».</p></div></td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    }
  `,
  styles: `
    .cabeza { flex-wrap: wrap; align-items: center; }
    .buscar { position: relative; display: block; width: min(300px, 100%); }
    .buscar app-icono { position: absolute; top: 50%; left: 11px; width: 17px; height: 17px; color: var(--gris); transform: translateY(-50%); }
    .buscar input { width: 100%; min-height: 40px; padding: 8px 12px 8px 36px; border: 1px solid rgba(66, 43, 43, 0.18); border-radius: 999px; background: var(--crema); font-size: 14px; }
    .buscar input:focus { outline: none; border-color: var(--naranja); background: #fff; box-shadow: 0 0 0 3px rgba(252, 138, 45, 0.25); }
    .enlace { text-decoration: none; }
    .enlace:hover { color: var(--tomate); text-decoration: underline; text-underline-offset: 3px; }
    .rojo { color: var(--mal) !important; }
  `,
})
export class DuenoClientes {
  protected datos = inject(DatosService);
  protected busqueda = signal('');

  protected filas = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    return this.datos
      .clientes()
      .filter((c) => !q || c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q))
      .map((c) => {
        const contratos = this.datos.contratos().filter((x) => x.clienteId === c.id);
        const pagos = this.datos.pagos().filter((p) => p.clienteId === c.id);
        return {
          c,
          contrato: contratos.find((x) => x.estado !== 'Finalizado') ?? null,
          ultimo: contratos.find((x) => x.estado === 'Finalizado') ?? null,
          saldo: pagos.filter((p) => p.estado !== 'Pagado').reduce((s, p) => s + p.monto, 0),
          vencido: pagos.some((p) => p.estado === 'Vencido'),
          pagado: pagos.filter((p) => p.estado === 'Pagado').reduce((s, p) => s + p.monto, 0),
          pendientes: this.datos.solicitudes().some((s) => s.clienteId === c.id && s.estado === 'Pendiente'),
        };
      })
      .sort((a, b) => Number(!!b.contrato) - Number(!!a.contrato) || a.c.nombre.localeCompare(b.c.nombre));
  });
  protected nombreBodega = (id: string) => this.datos.bodegas().find((b) => b.id === id)?.titulo ?? id;

  constructor() {
    this.datos.cargar(['clientes', 'contratos', 'pagos', 'bodegas', 'solicitudes']);
  }
}
