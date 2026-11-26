import { Bodega, Contrato, Pago, Rol, Solicitud } from '../models';

/**
 * Base de datos de ejemplo del backend simulado.
 * Todos los clientes, pagos y solicitudes son ficticios (proyecto escolar).
 */
export interface UsuarioDb {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  rol: Rol;
  password: string;
  registradoEn: string;
}

export type BodegaDb = Omit<Bodega, 'clienteNombre'>;
export type SolicitudDb = Omit<Solicitud, 'clienteNombre' | 'clienteTelefono' | 'clienteCorreo'>;
export type ContratoDb = Omit<Contrato, 'clienteNombre'>;
export type PagoDb = Omit<Pago, 'clienteNombre' | 'clienteId' | 'bodegaId' | 'estado'> & {
  estado: 'Pendiente' | 'Pagado';
};

export interface MockDb {
  version: number;
  usuarios: UsuarioDb[];
  bodegas: BodegaDb[];
  solicitudes: SolicitudDb[];
  contratos: ContratoDb[];
  pagos: PagoDb[];
  secuencia: number;
}

export const DB_VERSION = 1;

export function crearDbInicial(): MockDb {
  const usuarios: UsuarioDb[] = [
    { id: 'u-dueno', nombre: 'Administración Bodega Segura', correo: 'dueno@ejemplo.com', telefono: '951 461 6417', rol: 'dueno', password: 'demo123', registradoEn: '2026-01-10' },
    { id: 'u-maria', nombre: 'María López (ejemplo)', correo: 'maria@ejemplo.com', telefono: '951 000 0001', rol: 'cliente', password: 'demo123', registradoEn: '2026-05-20' },
    { id: 'u-juan', nombre: 'Juan Pérez (ejemplo)', correo: 'juan@ejemplo.com', telefono: '951 000 0002', rol: 'cliente', password: 'demo123', registradoEn: '2026-11-15' },
    { id: 'u-ana', nombre: 'Ana Martínez (ejemplo)', correo: 'ana@ejemplo.com', telefono: '951 000 0003', rol: 'cliente', password: 'demo123', registradoEn: '2026-11-22' },
    { id: 'u-comercial', nombre: 'Comercial Oaxaca (ejemplo)', correo: 'comercial@ejemplo.com', telefono: '951 000 0004', rol: 'cliente', password: 'demo123', registradoEn: '2026-02-25' },
    { id: 'u-luis', nombre: 'Luis Hernández (ejemplo)', correo: 'luis@ejemplo.com', telefono: '951 000 0005', rol: 'cliente', password: 'demo123', registradoEn: '2026-06-28' },
  ];

  const bodegas: BodegaDb[] = [
    {
      id: 'BOD-001', slug: 'pequeno', titulo: 'Espacio pequeño', dimensiones: '2 × 2 m', ancho: 2, fondo: 2, m2: 4, precio: 499,
      estado: 'Disponible', clienteId: null,
      descripcion: 'Un espacio compacto para mantener organizados objetos personales, cajas y documentación.',
      usos: ['Cajas y documentos', 'Objetos personales', 'Archivos y artículos de temporada'],
      detalles: ['Almacenamiento para pocas cajas', 'Fácil organización del espacio', 'Ideal para uso personal'],
    },
    {
      id: 'BOD-002', slug: 'mediano', titulo: 'Espacio mediano', dimensiones: '3 × 3 m', ancho: 3, fondo: 3, m2: 9, precio: 899,
      estado: 'Reservada', clienteId: 'u-juan',
      descripcion: 'Una opción intermedia para muebles, cajas de mudanza y mercancía de pequeños negocios.',
      usos: ['Muebles y sillas', 'Electrodomésticos', 'Inventario pequeño'],
      detalles: ['Útil para pequeñas mudanzas', 'Espacio versátil para cajas', 'Adecuado para artículos domésticos'],
    },
    {
      id: 'BOD-003', slug: 'grande', titulo: 'Espacio grande', dimensiones: '4 × 5 m', ancho: 4, fondo: 5, m2: 20, precio: 1199,
      estado: 'Ocupada', clienteId: 'u-maria',
      descripcion: 'Bodega amplia para mobiliario, equipo de oficina y mercancías de un negocio.',
      usos: ['Muebles de una casa', 'Mercancía', 'Equipos de oficina'],
      detalles: ['Permite separar artículos por zonas', 'Pensada para inventarios medianos', 'Mayor espacio para maniobrar'],
    },
    {
      id: 'BOD-004', slug: 'extra-grande', titulo: 'Espacio extra grande', dimensiones: '5 × 8 m', ancho: 5, fondo: 8, m2: 40, precio: 1799,
      estado: 'Disponible', clienteId: null,
      descripcion: 'El espacio más amplio del catálogo, adecuado para proyectos que requieren guardar más artículos.',
      usos: ['Automóviles, sujeto a condiciones', 'Inventario empresarial', 'Mudanzas y mobiliario voluminoso'],
      detalles: ['Gran superficie de almacenamiento', 'Apropiado para múltiples tipos de bienes', 'Consulta condiciones para vehículos'],
    },
  ];

  const contratos: ContratoDb[] = [
    { id: 'CON-0001', clienteId: 'u-comercial', bodegaId: 'BOD-001', inicio: '2026-03-01', fin: '2026-09-01', meses: 6, precioMensual: 499, estado: 'Finalizado', codigoAcceso: '3307' },
    { id: 'CON-0002', clienteId: 'u-maria', bodegaId: 'BOD-003', inicio: '2026-06-01', fin: '2027-06-01', meses: 12, precioMensual: 1199, estado: 'Activo', codigoAcceso: '4821' },
    { id: 'CON-0003', clienteId: 'u-luis', bodegaId: 'BOD-004', inicio: '2026-07-01', fin: '2026-12-01', meses: 5, precioMensual: 1799, estado: 'Finalizado', codigoAcceso: '9154' },
    { id: 'CON-0004', clienteId: 'u-juan', bodegaId: 'BOD-002', inicio: '2026-12-01', fin: '2027-06-01', meses: 6, precioMensual: 899, estado: 'Reservado', codigoAcceso: '6639' },
  ];

  const pagos: PagoDb[] = [];
  let folio = 1;
  const pagado = (contratoId: string, periodo: string, monto: number, dia: string, metodo: PagoDb['metodo']) => {
    pagos.push({
      id: `PAG-${String(folio).padStart(4, '0')}`, folio: `F-${String(folio).padStart(5, '0')}`,
      contratoId, concepto: `Mensualidad ${nombreMes(periodo)}`, periodo, monto,
      vence: `${periodo}-10`, estado: 'Pagado', pagadoEn: `${periodo}-${dia}T11:00:00`, metodo,
    });
    folio++;
  };
  const pendiente = (contratoId: string, periodo: string, monto: number, vence: string) => {
    pagos.push({
      id: `PAG-${String(folio).padStart(4, '0')}`, folio: `F-${String(folio).padStart(5, '0')}`,
      contratoId, concepto: `Mensualidad ${nombreMes(periodo)}`, periodo, monto,
      vence, estado: 'Pendiente', pagadoEn: null, metodo: null,
    });
    folio++;
  };

  for (const m of ['03', '04', '05', '06', '07', '08']) pagado('CON-0001', `2026-${m}`, 499, '04', 'Efectivo');
  for (const m of ['06', '07', '08', '09', '10']) pagado('CON-0002', `2026-${m}`, 1199, '06', 'Transferencia');
  for (const m of ['07', '08', '09', '10', '11']) pagado('CON-0003', `2026-${m}`, 1799, '08', 'Tarjeta');
  pendiente('CON-0002', '2026-11', 1199, '2026-11-10');
  pendiente('CON-0004', '2026-12', 899, '2026-12-01');

  const solicitudes: SolicitudDb[] = [
    { id: 'SOL-0001', clienteId: 'u-juan', bodegaId: 'BOD-002', fechaInicio: '2026-12-01', meses: 6, mensaje: 'Necesito guardar los muebles de mi departamento mientras me mudo.', estado: 'Aprobada', respuesta: 'Aprobada. Tu bodega queda reservada a partir del 1 de diciembre.', creadaEn: '2026-11-16T10:20:00' },
    { id: 'SOL-0002', clienteId: 'u-ana', bodegaId: 'BOD-004', fechaInicio: '2026-12-01', meses: 3, mensaje: 'Es para el inventario de temporada de mi tienda.', estado: 'Pendiente', respuesta: null, creadaEn: '2026-11-23T17:45:00' },
    { id: 'SOL-0003', clienteId: 'u-ana', bodegaId: 'BOD-003', fechaInicio: '2026-11-25', meses: 1, mensaje: 'Solo por un mes.', estado: 'Rechazada', respuesta: 'Esta bodega ya está ocupada. Te sugerimos el espacio extra grande.', creadaEn: '2026-11-22T09:05:00' },
  ];

  return { version: DB_VERSION, usuarios, bodegas, solicitudes, contratos, pagos, secuencia: 100 };
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export function nombreMes(periodo: string): string {
  const [anio, mes] = periodo.split('-').map(Number);
  return `${MESES[mes - 1]} ${anio}`;
}
