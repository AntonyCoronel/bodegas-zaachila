/**
 * Configuración de la conexión con el backend.
 *
 * - baseUrl: dónde vive la API. Con `ng serve` y proxy.conf.json se deja en '/api'.
 *   Si el backend corre en otro dominio, pon la URL completa, p. ej. 'http://localhost:3000/api'.
 * - useMockBackend: mientras el backend real no exista, un interceptor responde
 *   las mismas rutas con datos de ejemplo guardados en el navegador (localStorage).
 *   Cuando el backend esté listo, cámbialo a `false`. Nada más cambia en la app.
 *
 * El contrato completo de la API está en API.md.
 * Para usar el backend real sin editar este archivo: `npm run start:backend` (usa api-config.backend.ts).
 */
export const API_CONFIG = {
  baseUrl: '/api',
  useMockBackend: true,
};
