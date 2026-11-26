# Contrato de la API — Bodega Segura Zaachila

Este documento es para quien construya el backend. La app de Angular ya llama a estas rutas;
mientras el backend no exista, un **backend simulado** (`src/app/core/mock/mock-backend.interceptor.ts`)
las responde con datos de ejemplo guardados en el navegador. Ese archivo es la referencia viva:
si algo de aquí no queda claro, ahí está la lógica exacta.

## Cómo conectar el backend real

1. Levanten su servidor (por ejemplo en `http://localhost:3000`) con las rutas de abajo bajo el prefijo `/api`.
2. En `src/app/core/api-config.ts` cambien `useMockBackend` a `false`.
3. Con `npm start`, Angular reenvía `/api/*` a `http://localhost:3000` (archivo `proxy.conf.json`). Si su puerto es otro, cámbienlo ahí.
   Si el backend vive en otro dominio en producción, pongan la URL completa en `baseUrl` y habiliten CORS para el dominio del front.

## Reglas generales

- Todo es JSON (`Content-Type: application/json`).
- **Autenticación:** el login y el registro devuelven un `token`. La app lo manda en cada petición como
  `Authorization: Bearer <token>`. Puede ser un JWT o cualquier cadena que su servidor sepa validar.
- **Errores:** respondan con el código HTTP adecuado y este cuerpo; la app muestra `mensaje` tal cual al usuario, así que escríbanlo en español y claro:
  ```json
  { "mensaje": "Esta bodega ya no está disponible." }
  ```
  Códigos que usa la app: `400` datos inválidos, `401` sin sesión o token inválido, `403` sin permiso, `404` no existe, `409` conflicto de estado.
- **Fechas:** `AAAA-MM-DD` para días (`"2026-12-01"`) y `AAAA-MM-DDTHH:mm:ss` para momentos (`"2026-11-23T17:45:00"`). Periodos de pago: `AAAA-MM`.
- **Dinero:** pesos MXN como número entero (`1199`).
- **Roles:** `cliente` (quien renta) y `dueno` (administra todo).

## Modelos

```ts
Usuario   { id, nombre, correo, telefono, rol: 'cliente' | 'dueno' }
Cliente   = Usuario + { registradoEn: 'AAAA-MM-DD' }            // rol siempre 'cliente'

Bodega {
  id: 'BOD-001', slug: 'pequeno', titulo: 'Espacio pequeño', dimensiones: '2 × 2 m',
  ancho: 2, fondo: 2, m2: 4,             // metros; el plano se dibuja con ancho y fondo
  precio: 499,
  estado: 'Disponible' | 'Reservada' | 'Ocupada',
  clienteId: string | null,              // solo para el dueño o el cliente dueño de la bodega; null para los demás
  clienteNombre: string | null,          // misma regla de privacidad
  descripcion: string, usos: string[], detalles: string[]
}

Solicitud {
  id, clienteId, clienteNombre, clienteTelefono, clienteCorreo,
  bodegaId, fechaInicio: 'AAAA-MM-DD', meses: 1..24, mensaje,
  estado: 'Pendiente' | 'Aprobada' | 'Rechazada', respuesta: string | null, creadaEn
}

Contrato {
  id, clienteId, clienteNombre, bodegaId, inicio, fin, meses, precioMensual,
  estado: 'Reservado' | 'Activo' | 'Finalizado',
  codigoAcceso: '4821'                   // 4 dígitos; solo lo ve su cliente y el dueño
}

Pago {
  id, folio: 'F-00017', contratoId, clienteId, clienteNombre, bodegaId,
  concepto: 'Mensualidad noviembre 2026', periodo: 'AAAA-MM', monto, vence: 'AAAA-MM-DD',
  estado: 'Pendiente' | 'Vencido' | 'Pagado',   // 'Vencido' = pendiente con vence < hoy (calcúlenlo al responder)
  pagadoEn: string | null, metodo: 'Tarjeta' | 'Transferencia' | 'Efectivo' | null
}
```

Los slugs de las 4 bodegas deben ser `pequeno`, `mediano`, `grande` y `extra-grande`: las fotos y las páginas públicas (`/espacios/<slug>`) dependen de ellos.

## Rutas

| Método | Ruta | Quién | Cuerpo | Respuesta |
|---|---|---|---|---|
| POST | `/api/auth/login` | público | `{ correo, password }` | `{ token, usuario }` · 401 si no coinciden |
| POST | `/api/auth/registro` | público | `{ nombre, correo, telefono, password }` (mín. 6) | `{ token, usuario }` con rol `cliente` · 409 si el correo existe |
| GET | `/api/auth/yo` | con sesión | — | `Usuario` |
| GET | `/api/bodegas` | público | — | `Bodega[]` (sin datos del cliente si no corresponde) |
| GET | `/api/bodegas/:id` | público | — | `Bodega` |
| PATCH | `/api/bodegas/:id` | dueño | `{ precio?, estado?, clienteId? }` | `Bodega` actualizada |
| GET | `/api/solicitudes` | con sesión | — | dueño: todas · cliente: las suyas. Más recientes primero |
| POST | `/api/solicitudes` | cliente | `{ bodegaId, fechaInicio, meses, mensaje }` | `Solicitud` creada (`Pendiente`) |
| POST | `/api/solicitudes/:id/aprobar` | dueño | `{ respuesta? }` | `{ solicitud, contrato }` |
| POST | `/api/solicitudes/:id/rechazar` | dueño | `{ respuesta? }` | `{ solicitud }` |
| GET | `/api/contratos` | con sesión | — | dueño: todos · cliente: los suyos |
| POST | `/api/contratos/:id/activar` | dueño | `{}` | `Contrato` (`Reservado` → `Activo`) |
| POST | `/api/contratos/:id/finalizar` | dueño | `{}` | `Contrato` (`Finalizado`) |
| GET | `/api/pagos` | con sesión | — | dueño: todos · cliente: los suyos. Por `vence` descendente |
| POST | `/api/pagos/:id/pagar` | cliente dueño del pago, o dueño | `{ metodo }` | `Pago` (`Pagado`) |
| GET | `/api/clientes` | dueño | — | `Cliente[]` |

`POST /api/demo/reiniciar` solo existe en el backend simulado (botón «Restaurar datos de ejemplo»); el real no la necesita.

## Reglas del negocio que la app espera

- **Crear solicitud:** la bodega debe estar `Disponible` (si no, 409); `fechaInicio` desde hoy; `meses` de 1 a 24; no puede haber otra solicitud `Pendiente` del mismo cliente para la misma bodega (409).
- **Aprobar solicitud:** solo si está `Pendiente` y la bodega sigue `Disponible` (si no, 409 con un mensaje que diga qué hacer). Al aprobar:
  1. se crea un contrato `Reservado` (inicio = `fechaInicio`, fin = inicio + meses, precio = precio actual, código de 4 dígitos al azar);
  2. la bodega pasa a `Reservada` con ese `clienteId`;
  3. se genera el primer pago `Pendiente` (periodo = mes de inicio, vence = día de inicio).
- **Rechazar solicitud:** pasa a `Rechazada`; si no mandan `respuesta`, usen un texto amable por defecto.
- **Activar contrato** (el cliente recibe su bodega): `Reservado` → `Activo` y la bodega pasa a `Ocupada`. Desde aquí el cliente ve su código.
- **Finalizar contrato:** pasa a `Finalizado` y la bodega vuelve a `Disponible` sin cliente.
- **Editar bodega (PATCH):**
  - `precio` > 0.
  - `estado: 'Disponible'` finaliza el contrato vigente y quita el cliente.
  - `estado: 'Reservada' | 'Ocupada'` exige `clienteId` de un cliente. Si es el mismo del contrato vigente, solo cambia el estado del contrato (`Reservado`/`Activo`); si es otro, se finaliza el anterior y se crea un contrato de 1 mes desde hoy con su primer pago.
- **Pagar:** solo pagos no pagados (409 si ya lo está). Al pagar se guarda `metodo` y `pagadoEn`; si el contrato está `Activo` y aún no termina, se genera la mensualidad del mes siguiente (`Pendiente`, vence el día 10).
- **Privacidad:** un cliente nunca recibe nombres de otros clientes ni sus códigos; las rutas públicas no devuelven datos de clientes.

## Datos de ejemplo

`src/app/core/mock/mock-db.ts` tiene el conjunto inicial (4 bodegas, 5 clientes de ejemplo, contratos y pagos de marzo a diciembre de 2026). Pueden usarlo para su *seed*. Cuentas de prueba: `dueno@ejemplo.com` y `maria@ejemplo.com`, contraseña `demo123`.
