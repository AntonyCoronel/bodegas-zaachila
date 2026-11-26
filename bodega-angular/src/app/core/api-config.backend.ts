/**
 * Configuración para usar el backend real (carpeta backend/ del repo, .NET en http://localhost:3000).
 * Se usa con `npm run start:backend`: Angular reemplaza api-config.ts por este archivo
 * y el proxy (proxy.conf.json) reenvía /api a localhost:3000.
 */
export const API_CONFIG = {
  baseUrl: '/api',
  useMockBackend: false,
};
