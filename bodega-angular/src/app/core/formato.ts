import { Pipe, PipeTransform } from '@angular/core';

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const moneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export function dinero(n: number): string {
  return moneda.format(n);
}

/** '2026-11-10' → '10 nov 2026' */
export function fecha(iso: string | null | undefined, conAnio = true): string {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  return conAnio ? `${d} ${MESES_CORTOS[m - 1]} ${a}` : `${d} ${MESES_CORTOS[m - 1]}`;
}

/** '2026-11' → 'noviembre 2026' */
export function mes(periodo: string): string {
  const [a, m] = periodo.split('-').map(Number);
  return `${MESES[m - 1]} ${a}`;
}

export function mesCorto(periodo: string): string {
  const [, m] = periodo.split('-').map(Number);
  return MESES_CORTOS[m - 1];
}

export function hoyIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Días desde hoy hasta la fecha (negativo si ya pasó). */
export function diasHasta(iso: string): number {
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const objetivo = new Date(a, m - 1, d).getTime();
  const h = new Date();
  const hoy = new Date(h.getFullYear(), h.getMonth(), h.getDate()).getTime();
  return Math.round((objetivo - hoy) / 86_400_000);
}

@Pipe({ name: 'dinero' })
export class DineroPipe implements PipeTransform {
  transform(n: number | null | undefined): string {
    return n == null ? '—' : dinero(n);
  }
}

@Pipe({ name: 'fecha' })
export class FechaPipe implements PipeTransform {
  transform(iso: string | null | undefined, conAnio = true): string {
    return fecha(iso, conAnio);
  }
}

@Pipe({ name: 'mes' })
export class MesPipe implements PipeTransform {
  transform(periodo: string): string {
    return mes(periodo);
  }
}
