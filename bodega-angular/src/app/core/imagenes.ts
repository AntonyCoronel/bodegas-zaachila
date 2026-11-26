/** Fotos de cada bodega (en public/img/espacios). Se relacionan por el slug de la bodega. */
export function fotoReferencia(slug: string): string {
  return `img/espacios/${slug}-referencia.webp`;
}

export function fotoInterior(slug: string): string {
  return `img/espacios/${slug}-interior.webp`;
}

/** Página pública de cada bodega dentro del catálogo de espacios. */
export function rutaEspacio(slug: string): string {
  return `/espacios/${slug}`;
}
