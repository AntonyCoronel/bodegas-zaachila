# Backend — API de Bodegas Seguras Zaachila

API REST en **.NET 10** con **Entity Framework Core y SQLite**. Guarda las bodegas y las solicitudes de cotización que hoy viven en el `localStorage` de `bodegas_zaachila/assets/js/data.js`. Se prueba con **Postman**.

La API tiene dos partes, igual que el sitio:

| Parte | Páginas del sitio | Rutas de la API |
|---|---|---|
| **Usuarios** | `bodegas_zaachila/index.html` (catálogo y cotización), `bodegas_zaachila/bodega.html?id=N` (ficha) | `/api/...` |
| **Administración** | `bodegas_zaachila/dashboard.html` | `/api/admin/...` |

La parte de usuarios **no devuelve datos de clientes**. El cliente asignado a cada bodega solo aparece en `/api/admin/...`.

Esta carpeta es solo el backend: no cambia el diseño ni los archivos del sitio.

```
backend/
├─ BodegasZaachila.Api/          API (controladores, modelos, EF Core, SQLite)
│  ├─ Controllers/Usuarios/      catálogo, ficha, empresa y cotización
│  ├─ Controllers/Admin/         resumen, bodegas, solicitudes y restaurar demo
│  └─ BodegasZaachila.Api.http   peticiones para VS Code (REST Client) o Visual Studio
├─ postman/BodegasZaachila.postman_collection.json
└─ BodegasZaachila.slnx          solución para Visual Studio / Rider
```

## Requisitos

- .NET SDK 10
- Postman, para probar la API

## Levantar la API

Desde la raíz del repositorio:

```powershell
dotnet run --project backend/BodegasZaachila.Api
```

- La API queda en **http://localhost:5080**. `GET /` devuelve la lista de rutas.
- La primera vez crea `backend/BodegasZaachila.Api/bodegas.db` con las 4 bodegas demo de `data.js` (BOD-001 a BOD-004). El archivo `.db` no se sube a git.
- El documento OpenAPI está en http://localhost:5080/openapi/v1.json. Las rutas salen agrupadas en "Usuarios" y "Administración".

## Probar con Postman

1. En Postman: **Import** → selecciona `backend/postman/BodegasZaachila.postman_collection.json`.
2. Con la API en marcha, abre la colección y usa **Run collection**: 28 peticiones con 54 pruebas automáticas.
3. La primera petición restaura los datos demo, así que puedes correrla las veces que quieras.
4. La URL está en la variable `baseUrl` de la colección (`http://localhost:5080`).

## Endpoints

### Usuarios

| Método | Ruta | Uso en el sitio | Respuestas |
|---|---|---|---|
| GET | `/api/empresa` | Teléfono, correo, dirección y WhatsApp | 200 |
| GET | `/api/bodegas?estado=Disponible` | Catálogo (`index.html`); el filtro es opcional | 200, 400 |
| GET | `/api/bodegas/{id}` | Ficha (`bodega.html?id=N`) | 200, 404 |
| POST | `/api/solicitudes` | Formulario "Solicita una cotización" | 201, 400 |

### Administración

| Método | Ruta | Uso en `dashboard.html` | Respuestas |
|---|---|---|---|
| GET | `/api/admin/resumen` | Tarjetas: bodegas por estado, renta estimada y solicitudes por estado | 200 |
| GET | `/api/admin/bodegas?estado=Ocupada` | Tabla de bodegas con cliente asignado | 200, 400 |
| GET | `/api/admin/bodegas/{id}` | Abrir el modal de edición | 200, 404 |
| POST | `/api/admin/bodegas` | Alta de una bodega (el código BOD-00N se genera solo) | 201, 400, 409 |
| PUT | `/api/admin/bodegas/{id}` | Guardar el modal de edición | 200, 400, 404, 409 |
| DELETE | `/api/admin/bodegas/{id}` | Eliminar una bodega | 204, 404, 409 si tiene solicitudes |
| GET | `/api/admin/solicitudes?estado=&bodegaId=` | Tabla de solicitudes, la más reciente primero | 200, 400 |
| GET | `/api/admin/solicitudes/{id}` | Detalle de una solicitud | 200, 404 |
| PATCH | `/api/admin/solicitudes/{id}/estado` | Selector de estado: `{ "estado": "Contactado" }` | 200, 400, 404 |
| DELETE | `/api/admin/solicitudes/{id}` | Eliminar una solicitud | 204, 404 |
| POST | `/api/admin/demo/reset` | Botón "Restaurar demo" | 200 |

## Reglas de negocio (las mismas de `data.js`)

- Estados de una bodega: `Disponible`, `Reservada` u `Ocupada`.
- Una bodega Reservada u Ocupada **requiere un cliente**. Si pasa a Disponible, el cliente se borra.
- El volumen debe ser mayor que 0 y el precio no puede ser negativo.
- Solo se aceptan solicitudes de bodegas **Disponibles**. Nombre, teléfono y correo son obligatorios.
- Estados de una solicitud: `Pendiente`, `Contactado` o `Cerrado`.

Los errores usan el formato ProblemDetails con los mensajes en español:

```json
{
  "title": "Hay errores de validación",
  "status": 400,
  "errors": { "cliente": ["Asigna un cliente a la bodega reservada u ocupada"] }
}
```

## Conectar las páginas del sitio

- El JSON usa los mismos nombres de campo que `data.js` (`codigo`, `nombre`, `volumen`, `precio`, `estado`, `cliente`, `imagen`, `contenido`...).
- `imagen` trae la misma ruta que `data.js` (`assets/images/bodega-mini.png`), relativa a la carpeta `bodegas_zaachila/`.
- Ejemplo desde `index.html`:

  ```js
  const bodegas = await fetch('http://localhost:5080/api/bodegas').then(r => r.json());
  ```

- **CORS:** la API acepta llamadas desde Live Server de VS Code (`http://127.0.0.1:5500` y `http://localhost:5500`) y desde `http://localhost:4200`. Si sirves el sitio en otra dirección, agrégala en `Cors:Origenes` de `appsettings.json`. Abrir el HTML con doble clic (`file://`) no sirve para llamar a la API.

## Notas

- **Sin login.** Las rutas de administración están separadas pero abiertas: cualquiera que llegue a la API puede usarlas. Antes de publicarla hay que proteger `/api/admin` (por ejemplo, con JWT o una clave).
- `UseAppHost=false` en el `.csproj`: `dotnet run` ejecuta la DLL con `dotnet.exe` y no genera un `.exe` propio, que Smart App Control de Windows puede bloquear.
- Para empezar con datos limpios, borra `bodegas.db` o llama a `POST /api/admin/demo/reset`.
