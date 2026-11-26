# Bodega Segura Zaachila — versión Angular

El sitio original (HTML/CSS en la carpeta de arriba) pasado a Angular con el mismo diseño, más dos paneles:
uno para el **cliente** que renta una bodega y otro para el **dueño**.

## Cómo correrlo

```bash
cd bodega-angular
npm install --registry=https://registry.yarnpkg.com   # en redes donde npmjs.org no responde
npm start                                             # abre http://localhost:4200
```

Para generar la versión de producción: `npm run build` (queda en `dist/bodega-angular/browser`).

## Qué hay

| Ruta | Página | Viene de |
|---|---|---|
| `/` | Inicio | `index.html` |
| `/caracteristicas` | Características | `caracteristicas/caracteristicas.html` |
| `/tamanos` | Tamaños | `proyecto/tamanos.html` |
| `/ubicacion` | Ubicación | `proyecto/ubicacion.html` |
| `/contacto` | Contacto | `proyecto/contacto.html` |
| `/espacios` y `/espacios/:slug` | Los 4 espacios y su ficha | `proyecto/espacios/*.html` |
| `/login` | Entrar o crear cuenta | nuevo |
| `/cliente`, `/cliente/rentar`, `/cliente/pagos` | Panel del cliente | nuevo |
| `/dueno`, `/dueno/bodegas`, `/dueno/solicitudes`, `/dueno/pagos`, `/dueno/clientes` | Panel del dueño | nuevo |

**Panel del cliente:** ve su bodega en el plano, su contrato, su código de acceso 24/7 y su próximo pago;
solicita una bodega libre (fecha de inicio, meses y mensaje) y paga sus mensualidades (pago simulado).

**Panel del dueño:** ve el edificio de un vistazo y lo que necesita atención; aprueba o rechaza solicitudes;
edita precio, estado y cliente de cada bodega; marca bodegas como ocupadas o finaliza contratos; registra pagos
en efectivo y ve los ingresos de los últimos 6 meses; consulta la lista de clientes con su saldo.

Los dos paneles comparten un **plano de las 4 bodegas a escala** (2 × 2, 3 × 3, 4 × 5 y 5 × 8 m) coloreado por estado.

## Datos y backend

La app habla con una API REST (`/api/...`). Mientras el backend de mis compañeros no esté listo,
un backend simulado responde las mismas rutas con datos de ejemplo guardados en el navegador.

- Cuentas de ejemplo (contraseña `demo123`): `maria@ejemplo.com` (cliente) y `dueno@ejemplo.com` (dueño).
  En la pantalla de entrar hay botones para usarlas.
- En el panel del dueño, «Restaurar datos de ejemplo» regresa todo al inicio.
- **Para conectar el backend real** y ver todas las rutas y reglas: [API.md](API.md).

Todos los clientes, precios y pagos son ficticios (proyecto escolar).

## Estructura

```
src/app/
  core/        modelos, servicio de API, sesión, formato de fechas y dinero, backend simulado (mock/)
  sitio/       páginas públicas portadas del sitio original
  espacios/    catálogo de los 4 espacios y su ficha
  auth/        inicio de sesión y registro
  panel/       marco de los paneles, plano, gráfica, íconos y las pantallas de cliente/ y dueno/
```
