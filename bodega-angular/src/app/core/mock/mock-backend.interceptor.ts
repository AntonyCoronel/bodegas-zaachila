import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { mergeMap, of, throwError, timer } from 'rxjs';
import { API_CONFIG } from '../api-config';
import { Bodega, Cliente, Contrato, EstadoBodega, MetodoPago, Pago, Solicitud, Usuario } from '../models';
import { crearDbInicial, DB_VERSION, MockDb, nombreMes, UsuarioDb } from './mock-db';

/**
 * Backend simulado. Responde las mismas rutas que debe implementar el backend real
 * (ver API.md) y guarda los datos en localStorage. Se apaga con API_CONFIG.useMockBackend = false.
 */
const STORAGE_KEY = 'bodegaSegura.mockDb';
const LATENCIA_MS = 220;

class ErrorMock extends Error {
  constructor(public status: number, mensaje: string) {
    super(mensaje);
  }
}

export const mockBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!API_CONFIG.useMockBackend || !req.url.startsWith(API_CONFIG.baseUrl)) {
    return next(req);
  }
  const ruta = req.url.slice(API_CONFIG.baseUrl.length).split('?')[0];
  try {
    const body = atender(req, ruta);
    return timer(LATENCIA_MS).pipe(mergeMap(() => of(new HttpResponse({ status: 200, body, url: req.url }))));
  } catch (e) {
    const status = e instanceof ErrorMock ? e.status : 500;
    const mensaje = e instanceof Error ? e.message : 'Error inesperado del servidor';
    return timer(LATENCIA_MS).pipe(
      mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { mensaje }, url: req.url }))),
    );
  }
};

// ---------- Persistencia ----------

function leerDb(): MockDb {
  try {
    const guardada = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as MockDb | null;
    if (guardada && guardada.version === DB_VERSION) return guardada;
  } catch {
    /* datos dañados: se regeneran */
  }
  const nueva = crearDbInicial();
  guardarDb(nueva);
  return nueva;
}

function guardarDb(db: MockDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    /* sin almacenamiento disponible: los cambios duran hasta recargar */
  }
}

// ---------- Utilidades ----------

function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function sumarMeses(fecha: string, meses: number): string {
  const [a, m, d] = fecha.split('-').map(Number);
  const total = a * 12 + (m - 1) + meses;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function siguienteId(db: MockDb, prefijo: string): string {
  db.secuencia += 1;
  return `${prefijo}-${String(db.secuencia).padStart(4, '0')}`;
}

function usuarioPublico(u: UsuarioDb): Usuario {
  return { id: u.id, nombre: u.nombre, correo: u.correo, telefono: u.telefono, rol: u.rol };
}

function sesionDe(db: MockDb, req: HttpRequest<unknown>): UsuarioDb | null {
  const auth = req.headers.get('Authorization') ?? '';
  const id = auth.startsWith('Bearer mock.') ? auth.slice('Bearer mock.'.length) : '';
  return db.usuarios.find((u) => u.id === id) ?? null;
}

function exigir(usuario: UsuarioDb | null, rol?: 'cliente' | 'dueno'): UsuarioDb {
  if (!usuario) throw new ErrorMock(401, 'Inicia sesión para continuar.');
  if (rol && usuario.rol !== rol) throw new ErrorMock(403, 'No tienes permiso para esta acción.');
  return usuario;
}

function nombreDe(db: MockDb, id: string | null): string | null {
  return id ? (db.usuarios.find((u) => u.id === id)?.nombre ?? null) : null;
}

function vistaBodega(db: MockDb, b: MockDb['bodegas'][number], u: UsuarioDb | null): Bodega {
  const puedeVer = u?.rol === 'dueno' || (u !== null && b.clienteId === u.id);
  return { ...b, clienteId: puedeVer ? b.clienteId : null, clienteNombre: puedeVer ? nombreDe(db, b.clienteId) : null };
}

function vistaSolicitud(db: MockDb, s: MockDb['solicitudes'][number]): Solicitud {
  const c = db.usuarios.find((u) => u.id === s.clienteId);
  return { ...s, clienteNombre: c?.nombre ?? '', clienteTelefono: c?.telefono ?? '', clienteCorreo: c?.correo ?? '' };
}

function vistaContrato(db: MockDb, c: MockDb['contratos'][number]): Contrato {
  return { ...c, clienteNombre: nombreDe(db, c.clienteId) ?? '' };
}

function vistaPago(db: MockDb, p: MockDb['pagos'][number]): Pago {
  const contrato = db.contratos.find((c) => c.id === p.contratoId)!;
  const vencido = p.estado === 'Pendiente' && p.vence < hoy();
  return {
    ...p,
    estado: vencido ? 'Vencido' : p.estado,
    clienteId: contrato.clienteId,
    clienteNombre: nombreDe(db, contrato.clienteId) ?? '',
    bodegaId: contrato.bodegaId,
  };
}

function crearPagoPendiente(db: MockDb, contrato: MockDb['contratos'][number], periodo: string, vence: string): void {
  const n = db.pagos.length + 1;
  db.pagos.push({
    id: siguienteId(db, 'PAG'),
    folio: `F-${String(n).padStart(5, '0')}`,
    contratoId: contrato.id,
    concepto: `Mensualidad ${nombreMes(periodo)}`,
    periodo,
    monto: contrato.precioMensual,
    vence,
    estado: 'Pendiente',
    pagadoEn: null,
    metodo: null,
  });
}

function crearContrato(db: MockDb, clienteId: string, bodega: MockDb['bodegas'][number], inicio: string, meses: number, estado: 'Reservado' | 'Activo') {
  const contrato = {
    id: siguienteId(db, 'CON'),
    clienteId,
    bodegaId: bodega.id,
    inicio,
    fin: sumarMeses(inicio, meses),
    meses,
    precioMensual: bodega.precio,
    estado,
    codigoAcceso: String(1000 + Math.floor(Math.random() * 9000)),
  };
  db.contratos.push(contrato);
  crearPagoPendiente(db, contrato, inicio.slice(0, 7), inicio);
  return contrato;
}

function contratoVigente(db: MockDb, bodegaId: string) {
  return db.contratos.find((c) => c.bodegaId === bodegaId && c.estado !== 'Finalizado');
}

// ---------- Rutas ----------

function atender(req: HttpRequest<unknown>, ruta: string): unknown {
  const db = leerDb();
  const yo = sesionDe(db, req);
  const body = (req.body ?? {}) as Record<string, unknown>;
  const m = req.method;
  let r: RegExpMatchArray | null;

  // Autenticación
  if (m === 'POST' && ruta === '/auth/login') {
    const correo = String(body['correo'] ?? '').trim().toLowerCase();
    const u = db.usuarios.find((x) => x.correo === correo && x.password === body['password']);
    if (!u) throw new ErrorMock(401, 'Correo o contraseña incorrectos.');
    return { token: `mock.${u.id}`, usuario: usuarioPublico(u) };
  }
  if (m === 'POST' && ruta === '/auth/registro') {
    const nombre = String(body['nombre'] ?? '').trim();
    const correo = String(body['correo'] ?? '').trim().toLowerCase();
    const telefono = String(body['telefono'] ?? '').trim();
    const password = String(body['password'] ?? '');
    if (!nombre || !correo || !telefono) throw new ErrorMock(400, 'Completa nombre, correo y teléfono.');
    if (password.length < 6) throw new ErrorMock(400, 'La contraseña debe tener al menos 6 caracteres.');
    if (db.usuarios.some((x) => x.correo === correo)) throw new ErrorMock(409, 'Ya existe una cuenta con ese correo.');
    const u: UsuarioDb = { id: siguienteId(db, 'u'), nombre, correo, telefono, rol: 'cliente', password, registradoEn: hoy() };
    db.usuarios.push(u);
    guardarDb(db);
    return { token: `mock.${u.id}`, usuario: usuarioPublico(u) };
  }
  if (m === 'GET' && ruta === '/auth/yo') {
    return usuarioPublico(exigir(yo));
  }

  // Bodegas
  if (m === 'GET' && ruta === '/bodegas') {
    return db.bodegas.map((b) => vistaBodega(db, b, yo));
  }
  if ((r = ruta.match(/^\/bodegas\/([\w-]+)$/))) {
    const bodega = db.bodegas.find((b) => b.id === r![1]);
    if (!bodega) throw new ErrorMock(404, 'La bodega no existe.');
    if (m === 'GET') return vistaBodega(db, bodega, yo);
    if (m === 'PATCH') {
      exigir(yo, 'dueno');
      if (body['precio'] !== undefined) {
        const precio = Number(body['precio']);
        if (!Number.isFinite(precio) || precio <= 0) throw new ErrorMock(400, 'Introduce un precio válido.');
        bodega.precio = Math.round(precio);
      }
      if (body['estado'] !== undefined) {
        const estado = body['estado'] as EstadoBodega;
        if (!['Disponible', 'Reservada', 'Ocupada'].includes(estado)) throw new ErrorMock(400, 'Estado no válido.');
        const vigente = contratoVigente(db, bodega.id);
        if (estado === 'Disponible') {
          if (vigente) vigente.estado = 'Finalizado';
          bodega.clienteId = null;
        } else {
          const clienteId = String(body['clienteId'] ?? bodega.clienteId ?? '');
          const cliente = db.usuarios.find((u) => u.id === clienteId && u.rol === 'cliente');
          if (!cliente) throw new ErrorMock(400, 'Asigna un cliente para reservar u ocupar la bodega.');
          const estadoContrato = estado === 'Ocupada' ? 'Activo' : 'Reservado';
          if (vigente && vigente.clienteId === cliente.id) {
            vigente.estado = estadoContrato;
          } else {
            if (vigente) vigente.estado = 'Finalizado';
            crearContrato(db, cliente.id, bodega, hoy(), 1, estadoContrato);
          }
          bodega.clienteId = cliente.id;
        }
        bodega.estado = estado;
      }
      guardarDb(db);
      return vistaBodega(db, bodega, yo);
    }
  }

  // Solicitudes
  if (ruta === '/solicitudes') {
    const u = exigir(yo);
    if (m === 'GET') {
      const lista = u.rol === 'dueno' ? db.solicitudes : db.solicitudes.filter((s) => s.clienteId === u.id);
      return lista.map((s) => vistaSolicitud(db, s)).sort((a, b) => b.creadaEn.localeCompare(a.creadaEn));
    }
    if (m === 'POST') {
      exigir(yo, 'cliente');
      const bodega = db.bodegas.find((b) => b.id === body['bodegaId']);
      if (!bodega) throw new ErrorMock(404, 'La bodega no existe.');
      if (bodega.estado !== 'Disponible') throw new ErrorMock(409, 'Esta bodega ya no está disponible.');
      const meses = Number(body['meses']);
      const fechaInicio = String(body['fechaInicio'] ?? '');
      if (!Number.isInteger(meses) || meses < 1 || meses > 24) throw new ErrorMock(400, 'Elige de 1 a 24 meses.');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaInicio) || fechaInicio < hoy()) throw new ErrorMock(400, 'Elige una fecha de inicio a partir de hoy.');
      if (db.solicitudes.some((s) => s.clienteId === u.id && s.bodegaId === bodega.id && s.estado === 'Pendiente')) {
        throw new ErrorMock(409, 'Ya tienes una solicitud pendiente para esta bodega.');
      }
      const nueva = {
        id: siguienteId(db, 'SOL'), clienteId: u.id, bodegaId: bodega.id, fechaInicio, meses,
        mensaje: String(body['mensaje'] ?? '').trim().slice(0, 500), estado: 'Pendiente' as const, respuesta: null,
        creadaEn: new Date().toISOString().slice(0, 19),
      };
      db.solicitudes.push(nueva);
      guardarDb(db);
      return vistaSolicitud(db, nueva);
    }
  }
  if ((r = ruta.match(/^\/solicitudes\/([\w-]+)\/(aprobar|rechazar)$/)) && m === 'POST') {
    exigir(yo, 'dueno');
    const s = db.solicitudes.find((x) => x.id === r![1]);
    if (!s) throw new ErrorMock(404, 'La solicitud no existe.');
    if (s.estado !== 'Pendiente') throw new ErrorMock(409, 'Esta solicitud ya fue respondida.');
    if (r[2] === 'rechazar') {
      s.estado = 'Rechazada';
      s.respuesta = String(body['respuesta'] ?? '').trim() || 'Por ahora no podemos atender tu solicitud.';
      guardarDb(db);
      return { solicitud: vistaSolicitud(db, s) };
    }
    const bodega = db.bodegas.find((b) => b.id === s.bodegaId)!;
    if (bodega.estado !== 'Disponible') throw new ErrorMock(409, `${bodega.titulo} ya no está disponible. Rechaza la solicitud o libera la bodega primero.`);
    const inicio = s.fechaInicio < hoy() ? hoy() : s.fechaInicio;
    const contrato = crearContrato(db, s.clienteId, bodega, inicio, s.meses, 'Reservado');
    bodega.estado = 'Reservada';
    bodega.clienteId = s.clienteId;
    s.estado = 'Aprobada';
    s.respuesta = String(body['respuesta'] ?? '').trim() || `Aprobada. Tu bodega queda reservada a partir del ${inicio.split('-').reverse().join('/')}.`;
    guardarDb(db);
    return { solicitud: vistaSolicitud(db, s), contrato: vistaContrato(db, contrato) };
  }

  // Contratos
  if (m === 'GET' && ruta === '/contratos') {
    const u = exigir(yo);
    const lista = u.rol === 'dueno' ? db.contratos : db.contratos.filter((c) => c.clienteId === u.id);
    return lista.map((c) => vistaContrato(db, c)).sort((a, b) => b.inicio.localeCompare(a.inicio));
  }
  if ((r = ruta.match(/^\/contratos\/([\w-]+)\/(activar|finalizar)$/)) && m === 'POST') {
    exigir(yo, 'dueno');
    const c = db.contratos.find((x) => x.id === r![1]);
    if (!c) throw new ErrorMock(404, 'El contrato no existe.');
    const bodega = db.bodegas.find((b) => b.id === c.bodegaId)!;
    if (r[2] === 'activar') {
      if (c.estado !== 'Reservado') throw new ErrorMock(409, 'Solo un contrato reservado se puede activar.');
      c.estado = 'Activo';
      bodega.estado = 'Ocupada';
    } else {
      if (c.estado === 'Finalizado') throw new ErrorMock(409, 'El contrato ya está finalizado.');
      c.estado = 'Finalizado';
      if (bodega.clienteId === c.clienteId) {
        bodega.estado = 'Disponible';
        bodega.clienteId = null;
      }
    }
    guardarDb(db);
    return vistaContrato(db, c);
  }

  // Pagos
  if (m === 'GET' && ruta === '/pagos') {
    const u = exigir(yo);
    const propios = new Set(db.contratos.filter((c) => c.clienteId === u.id).map((c) => c.id));
    const lista = u.rol === 'dueno' ? db.pagos : db.pagos.filter((p) => propios.has(p.contratoId));
    return lista.map((p) => vistaPago(db, p)).sort((a, b) => b.vence.localeCompare(a.vence));
  }
  if ((r = ruta.match(/^\/pagos\/([\w-]+)\/pagar$/)) && m === 'POST') {
    const u = exigir(yo);
    const p = db.pagos.find((x) => x.id === r![1]);
    if (!p) throw new ErrorMock(404, 'El pago no existe.');
    const contrato = db.contratos.find((c) => c.id === p.contratoId)!;
    if (u.rol === 'cliente' && contrato.clienteId !== u.id) throw new ErrorMock(403, 'Este pago no es tuyo.');
    if (p.estado === 'Pagado') throw new ErrorMock(409, 'Este pago ya está liquidado.');
    const metodo = body['metodo'] as MetodoPago;
    if (!['Tarjeta', 'Transferencia', 'Efectivo'].includes(metodo)) throw new ErrorMock(400, 'Elige un método de pago.');
    p.estado = 'Pagado';
    p.metodo = metodo;
    p.pagadoEn = new Date().toISOString().slice(0, 19);
    // Genera la siguiente mensualidad si el contrato sigue vigente.
    const siguiente = sumarMeses(`${p.periodo}-01`, 1).slice(0, 7);
    if (contrato.estado === 'Activo' && `${siguiente}-01` < contrato.fin && !db.pagos.some((x) => x.contratoId === contrato.id && x.periodo === siguiente)) {
      crearPagoPendiente(db, contrato, siguiente, `${siguiente}-10`);
    }
    guardarDb(db);
    return vistaPago(db, p);
  }

  // Clientes
  if (m === 'GET' && ruta === '/clientes') {
    exigir(yo, 'dueno');
    return db.usuarios
      .filter((u) => u.rol === 'cliente')
      .map((u): Cliente => ({ ...usuarioPublico(u), rol: 'cliente', registradoEn: u.registradoEn }));
  }

  // Solo existe en el backend simulado
  if (m === 'POST' && ruta === '/demo/reiniciar') {
    exigir(yo, 'dueno');
    guardarDb(crearDbInicial());
    return { ok: true };
  }

  throw new ErrorMock(404, `Ruta no encontrada: ${m} ${ruta}`);
}
