export type Rol = 'cliente' | 'dueno';
export type EstadoBodega = 'Disponible' | 'Reservada' | 'Ocupada';
export type EstadoSolicitud = 'Pendiente' | 'Aprobada' | 'Rechazada';
export type EstadoContrato = 'Reservado' | 'Activo' | 'Finalizado';
export type EstadoPago = 'Pendiente' | 'Vencido' | 'Pagado';
export type MetodoPago = 'Tarjeta' | 'Transferencia' | 'Efectivo';

export interface Usuario {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

export interface Bodega {
  id: string;
  slug: string;
  titulo: string;
  dimensiones: string;
  /** Metros de frente (sobre el pasillo). */
  ancho: number;
  /** Metros de fondo. */
  fondo: number;
  m2: number;
  precio: number;
  estado: EstadoBodega;
  /** Solo llega con sesión de dueño, o al cliente si la bodega es suya. */
  clienteId: string | null;
  clienteNombre: string | null;
  descripcion: string;
  usos: string[];
  detalles: string[];
}

export interface CambiosBodega {
  precio?: number;
  estado?: EstadoBodega;
  clienteId?: string | null;
}

export interface Solicitud {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  clienteCorreo: string;
  bodegaId: string;
  fechaInicio: string;
  meses: number;
  mensaje: string;
  estado: EstadoSolicitud;
  respuesta: string | null;
  creadaEn: string;
}

export interface NuevaSolicitud {
  bodegaId: string;
  fechaInicio: string;
  meses: number;
  mensaje: string;
}

export interface Contrato {
  id: string;
  clienteId: string;
  clienteNombre: string;
  bodegaId: string;
  inicio: string;
  fin: string;
  meses: number;
  precioMensual: number;
  estado: EstadoContrato;
  codigoAcceso: string;
}

export interface Pago {
  id: string;
  folio: string;
  contratoId: string;
  clienteId: string;
  clienteNombre: string;
  bodegaId: string;
  concepto: string;
  /** Mes que cubre, formato AAAA-MM. */
  periodo: string;
  monto: number;
  vence: string;
  estado: EstadoPago;
  pagadoEn: string | null;
  metodo: MetodoPago | null;
}

export interface Cliente extends Usuario {
  rol: 'cliente';
  registradoEn: string;
}

export interface ErrorApi {
  mensaje: string;
}
