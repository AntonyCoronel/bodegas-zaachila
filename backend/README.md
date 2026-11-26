# Backend — API de Bodega Segura Zaachila

API REST en **.NET 10** con **Entity Framework Core y SQLite** para la app Angular de la rama `angular-dashboards` (`bodega-angular/`).

Implementa el contrato de [`bodega-angular/API.md`](https://github.com/AntonyCoronel/bodegas-zaachila/blob/angular-dashboards/bodega-angular/API.md): las mismas rutas, modelos, reglas y mensajes que el backend simulado (`src/app/core/mock/mock-backend.interceptor.ts`), con los mismos datos de ejemplo.

La app tiene dos paneles y la API respeta los dos roles:

| Rol | Panel | Qué puede hacer |
|---|---|---|
| `cliente` (usuarios) | `/cliente` | Ver su bodega, su contrato y su código de acceso; solicitar una bodega libre; pagar sus mensualidades |
| `dueno` (administración) | `/dueno` | Aprobar o rechazar solicitudes, activar y finalizar contratos, editar bodegas, registrar pagos y ver clientes |

Sin sesión solo se ven las bodegas, sin datos de clientes. Un cliente nunca recibe nombres ni códigos de otros clientes.

```
backend/
├─ BodegasZaachila.Api/
│  ├─ Controllers/        auth, bodegas, solicitudes, contratos, pagos, clientes y demo
│  ├─ Models/             entidades (Usuario, Bodega, Solicitud, Contrato, Pago)
│  ├─ Data/               AppDbContext y DatosEjemplo (los mismos de mock-db.ts)
│  ├─ Servicios/          reglas compartidas, fechas, token JWT y vistas con privacidad
│  └─ BodegasZaachila.Api.http   peticiones para VS Code (REST Client) o Visual Studio
├─ postman/BodegaSegura.postman_collection.json
└─ BodegasZaachila.slnx
```

## Requisitos

- .NET SDK 10
- Postman, para probar la API

## Levantar la API

Desde la raíz del repositorio:

```powershell
dotnet run --project backend/BodegasZaachila.Api
```

- Escucha en **http://localhost:3000**, el puerto que ya usa `bodega-angular/proxy.conf.json`.
- La primera vez crea `backend/BodegasZaachila.Api/bodega-segura.db` con los datos de ejemplo. El `.db` no se sube a git.
- `GET /` lista las rutas. El documento OpenAPI está en http://localhost:3000/openapi/v1.json.

Cuentas de prueba (contraseña `demo123`): `dueno@ejemplo.com` (dueño) y `maria@ejemplo.com` (cliente). También existen `juan@`, `ana@`, `comercial@` y `luis@ejemplo.com`.

## Conectar la app Angular

1. Levanta la API (arriba).
2. En `bodega-angular/src/app/core/api-config.ts` cambia `useMockBackend` a `false`.
3. En otra terminal:

   ```powershell
   cd bodega-angular
   npm install --registry=https://registry.yarnpkg.com
   npm start
   ```

4. Abre http://localhost:4200. Angular reenvía `/api/*` a `http://localhost:3000`, así que no hace falta CORS.

Si la app llama a la API con la URL completa (`baseUrl: 'http://localhost:3000/api'`), agrega su origen en `Cors:Origenes` de `appsettings.json`. `http://localhost:4200` ya está.

## Probar con Postman

1. En Postman: **Import** → `backend/postman/BodegaSegura.postman_collection.json`.
2. Con la API en marcha, usa **Run collection**: 52 peticiones con 106 pruebas automáticas.
3. La primera carpeta entra como dueño y restaura los datos de ejemplo. Los tokens se guardan solos en `tokenDueno` y `tokenCliente`.
4. La última petición vuelve a restaurar los datos, así la app queda como al principio.

## Rutas

| Método | Ruta | Quién | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/login` | público | `{ correo, password }` | `{ token, usuario }` · 401 |
| POST | `/api/auth/registro` | público | `{ nombre, correo, telefono, password }` | 201 `{ token, usuario }` (rol `cliente`) · 400 · 409 |
| GET | `/api/auth/yo` | con sesión | — | `Usuario` |
| GET | `/api/bodegas` | público | — | `Bodega[]` |
| GET | `/api/bodegas/{id}` | público | — | `Bodega` · 404 |
| PATCH | `/api/bodegas/{id}` | dueño | `{ precio?, estado?, clienteId? }` | `Bodega` · 400 · 404 |
| GET | `/api/solicitudes` | con sesión | — | dueño: todas · cliente: las suyas |
| POST | `/api/solicitudes` | cliente | `{ bodegaId, fechaInicio, meses, mensaje }` | 201 `Solicitud` · 400 · 404 · 409 |
| POST | `/api/solicitudes/{id}/aprobar` | dueño | `{ respuesta? }` | `{ solicitud, contrato }` · 409 |
| POST | `/api/solicitudes/{id}/rechazar` | dueño | `{ respuesta? }` | `{ solicitud }` · 409 |
| GET | `/api/contratos` | con sesión | — | dueño: todos · cliente: los suyos |
| POST | `/api/contratos/{id}/activar` | dueño | `{}` | `Contrato` · 409 |
| POST | `/api/contratos/{id}/finalizar` | dueño | `{}` | `Contrato` · 409 |
| GET | `/api/pagos` | con sesión | — | dueño: todos · cliente: los suyos |
| POST | `/api/pagos/{id}/pagar` | cliente dueño del pago, o dueño | `{ metodo }` | `Pago` · 400 · 403 · 409 |
| GET | `/api/clientes` | dueño | — | `Cliente[]` |
| POST | `/api/demo/reiniciar` | dueño | — | `{ ok: true }` |

`/api/demo/reiniciar` no es parte del contrato. Se deja para el botón «Restaurar datos de ejemplo» y para Postman.

## Reglas (las de API.md)

- **Sesión:** el token es un JWT que la app manda como `Authorization: Bearer <token>`. Dura 7 días (`Jwt:HorasDeValidez`). Las contraseñas se guardan con hash.
- **Solicitar:** la bodega debe estar `Disponible` (409), la fecha desde hoy, de 1 a 24 meses, y sin otra solicitud `Pendiente` del mismo cliente para esa bodega (409).
- **Aprobar:** se crea un contrato `Reservado` (precio actual, código de 4 dígitos al azar), la bodega pasa a `Reservada` y se genera el primer pago `Pendiente`.
- **Activar:** `Reservado` → `Activo` y la bodega pasa a `Ocupada`. **Finalizar:** `Finalizado` y la bodega vuelve a `Disponible`.
- **Editar bodega:** `Disponible` finaliza el contrato vigente. `Reservada` u `Ocupada` exigen `clienteId`: con el mismo cliente solo cambia el estado del contrato; con otro se crea un contrato de 1 mes desde hoy con su primer pago.
- **Pagar:** solo pagos no pagados (409). Si el contrato está `Activo` y no ha terminado, se genera la mensualidad del mes siguiente (vence el día 10).
- **Vencido:** un pago `Pendiente` cuya fecha de vencimiento ya pasó se responde como `Vencido`.
- **Fechas:** días `AAAA-MM-DD`, momentos `AAAA-MM-DDTHH:mm:ss`, periodos `AAAA-MM`. "Hoy" se calcula con la zona `ZonaHoraria` (`America/Mexico_City`).
- **Errores:** siempre `{ "mensaje": "..." }` en español, con 400, 401, 403, 404 o 409.

## Configuración

| Clave en `appsettings.json` | Para qué |
|---|---|
| `ConnectionStrings:Bodegas` | Archivo SQLite (`bodega-segura.db`) |
| `Jwt:Clave` | Clave para firmar los tokens. `appsettings.Development.json` trae una **solo para desarrollo**. En producción ponla como variable de entorno `Jwt__Clave` (mínimo 32 caracteres). Si falta, se genera una al azar al arrancar y las sesiones se pierden al reiniciar |
| `Jwt:HorasDeValidez` | Duración de la sesión (168 h = 7 días) |
| `ZonaHoraria` | Zona para calcular "hoy" |
| `Cors:Origenes` | Sitios que pueden llamar a la API desde el navegador sin proxy |

## Notas

- `UseAppHost=false` en el `.csproj`: `dotnet run` ejecuta la DLL con `dotnet.exe` y no genera un `.exe` propio, que Smart App Control de Windows puede bloquear.
- Para empezar con datos limpios, borra `bodega-segura.db` o llama a `POST /api/demo/reiniciar` con la sesión del dueño.
- Todos los clientes, precios y pagos de ejemplo son ficticios (proyecto escolar).
