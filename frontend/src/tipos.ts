export interface Proyecto {
  _id: string;
  nombre: string;
  cliente?: string;
  direccion?: string;
  fechaCreacion: string;
  piezas: PiezaPlano[];
}

export type RolUsuario = 'usuario' | 'admin';
export type MotivoAcceso = 'prueba' | 'suscripcion' | 'expirado' | 'bloqueado';

export interface EstadoAcceso {
  enPrueba: boolean;
  diasPruebaRestantes: number;
  pruebaHasta: string;
  suscripcionActiva: boolean;
  suscripcionHasta: string | null;
  permiteAcceso: boolean;
  motivo: MotivoAcceso;
  precioUsd: number;
}

export interface PagoSuscripcion {
  fecha: string | null;
  montoUsd: number;
  moneda: string;
  montoLocal: number;
  referencia: string;
}

export interface Usuario {
  _id: string;
  nombre: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  fechaRegistro: string | null;
  pruebaHasta: string;
  suscripcion: {
    activa: boolean;
    fechaInicio: string | null;
    fechaFin: string | null;
    ultimoPago: string | null;
  };
  pagos: PagoSuscripcion[];
  pais?: string;
  moneda?: string;
  estado: EstadoAcceso;
}

export interface PrecioSuscripcion {
  pais: string;
  paisNombre: string;
  moneda: string;
  simbolo: string;
  locale: string;
  precioUsd: number;
  precioLocal: number;
  tasa: number;
  fuente: 'base' | 'vivo' | 'respaldo';
  actualizado: string | null;
  periodoDias: number;
  diasPrueba: number;
}

export interface DatosUsuarioAdmin {
  nombre?: string;
  email?: string;
  contrasena?: string;
  rol?: RolUsuario;
  activo?: boolean;
  pruebaHasta?: string;
  suscripcion?: {
    activa?: boolean;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  };
}

export interface HojaDiseno {
  tipo: 'corredera' | 'fija' | 'batiente' | 'basculante';
  proporcion: number;
}

export interface DisenoVentaneria {
  tipo: 'corredera' | 'fijo' | 'batiente' | 'basculante' | 'divibano' | 'alacena';
  apiladas: boolean;
  hojas: HojaDiseno[];
}

export interface ModeloVentaneria {
  id: string;
  nombre: string;
  sistema: string;
  diseno: DisenoVentaneria;
  ejemplo: { ancho: number; alto: number };
}

export interface Ventana {
  _id?: string;
  modeloId: string;
  nombre: string;
  x: number;
  y: number;
  anchoCm: number;
  altoCm: number;
}

export type OrientacionPieza = 'horizontal' | 'vertical' | 'punto';

export interface PiezaPlano {
  id: string;
  tipo: string;
  ref: string;
  descripcion: string;
  x: number;
  y: number;
  largoCm: number;
  anchoCm: number;
  altoCm: number;
  orientacion: OrientacionPieza;
  espesorMm: number;
  cantidad: number;
  dePreset?: boolean;
}

export type PerfilCategoria =
  | 'vidrio'
  | 'cabezal'
  | 'sillar'
  | 'jamba'
  | 'hoja'
  | 'horizontal'
  | 'riel'
  | 'canal-u'
  | 'rodachina'
  | 'manija'
  | 'empaque'
  | 'tubo'
  | 'otro';

export interface PerfilVentaneria {
  ref: string;
  descripcion: string;
  categoria: PerfilCategoria;
  sistema: string;
  precioMetro?: number;
  precioTramo?: number;
}

export interface LineaPiezaDespiece {
  ref: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  ml: number;
  precioMetro?: number;
  subtotal?: number;
}

export interface VidrioPiezaDespiece {
  descripcion: string;
  espesorMm: number;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  m2: number;
}

export interface DespiecePiezas {
  lineas: LineaPiezaDespiece[];
  vidrios: VidrioPiezaDespiece[];
  totalMl: number;
  totalVidrioM2: number;
  totalHerrajes: number;
}

export interface PiezaDespiece {
  ref: string;
  descripcion: string;
  medidaCm: number;
  cantidad: number;
  corteGrados: number;
  ml: number;
}

export interface VidrioDespiece {
  descripcion: string;
  material: 'vidrio' | 'acrilico';
  espesorMm: number;
  altoCm: number;
  anchoCm: number;
  cantidad: number;
}

export interface AccesorioDespiece {
  seccion: string;
  descripcion: string;
  cantidad: number;
}

export interface DespieceVentaneria {
  modeloId: string;
  modeloNombre: string;
  anchoCm: number;
  altoCm: number;
  areaM2: number;
  piezas: PiezaDespiece[];
  vidrios: VidrioDespiece[];
  empaqueMl: number;
  accesorios: AccesorioDespiece[];
  totalMl: number;
}