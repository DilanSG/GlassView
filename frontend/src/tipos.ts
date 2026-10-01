export interface HuecoProyecto {
  anchoCm: number;
  altoCm: number;
}

export interface Proyecto {
  _id: string;
  nombre: string;
  cliente?: string;
  direccion?: string;
  /** Medidas del hueco de obra; null o ausente = mapa libre. */
  hueco?: HuecoProyecto | null;
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

export type OrientacionPieza = 'horizontal' | 'vertical' | 'punto';

export interface PuntoForma {
  x: number;
  y: number;
}

export interface TrazoForma {
  rol: 'contorno' | 'vacio';
  puntos: PuntoForma[];
  /** false mientras se está trazando; al cerrarse pasa a ser una figura. */
  cerrado?: boolean;
  /** false oculta la capa sin borrarla. */
  visible?: boolean;
  /** Nombre propio de la capa; si falta se muestra «Capa N». */
  nombre?: string;
  /** Material propio de la capa; si falta, usa el de la pieza. */
  material?: MaterialPiezaGuardado;
}

/**
 * Forma libre dibujada por el usuario en un lienzo de diseño (cm). Al colocar
 * la pieza, la forma se escala a su rectángulo: `contorno` es la silueta y
 * `vacio` las cámaras huecas. `color` es el color del material elegido.
 */
export interface FormaPieza {
  anchoCm: number;
  altoCm: number;
  color?: string;
  trazos: TrazoForma[];
}

export type TipoPiezaPersonalizada = 'perfil' | 'vidrio' | 'acrilico' | 'herraje';

/** Material de una pieza: nombre visible, color y familia a la que pertenece. */
export interface MaterialPieza {
  id: string;
  nombre: string;
  color: string;
  tipo: TipoPiezaPersonalizada;
}

/** Material guardado en la pieza (snapshot, para que la forma lo conserve). */
export interface MaterialPiezaGuardado {
  nombre: string;
  color: string;
}

/** Pieza de la biblioteca del usuario; puede ser privada o pública. */
export interface PiezaPersonalizada {
  _id: string;
  nombre: string;
  ref: string;
  tipo: TipoPiezaPersonalizada;
  categoria: PerfilCategoria;
  publico: boolean;
  espesorMm: number;
  material?: MaterialPiezaGuardado;
  forma: FormaPieza;
  usuario?: string;
}

export interface DatosPiezaPersonalizada {
  nombre: string;
  ref?: string;
  tipo: TipoPiezaPersonalizada;
  categoria: PerfilCategoria;
  publico: boolean;
  espesorMm?: number;
  material?: MaterialPiezaGuardado;
  forma: FormaPieza;
}

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
  forma?: FormaPieza;
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
}

export interface LineaPiezaDespiece {
  ref: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  ml: number;
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
