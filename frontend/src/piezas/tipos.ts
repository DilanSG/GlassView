import type { PiezaPlano } from '../tipos';

export interface Punto {
  x: number;
  y: number;
}

/** Materiales con los que se pinta una pieza (se mapean a la paleta del tema). */
export type TonoPieza =
  | 'perfil'
  | 'perfilClaro'
  | 'perfilOscuro'
  | 'perfilBorde'
  | 'perfilDetalle'
  | 'corte'
  | 'vidrio'
  | 'vidrioBorde'
  | 'vidrioBrillo'
  | 'acrilico'
  | 'acrilicoBorde'
  | 'herraje'
  | 'herrajeClaro'
  | 'herrajeOscuro'
  | 'empaque';

/**
 * Primitivas de dibujo abstractas: las consumen por igual el render de Konva
 * (elevación) y el render SVG (sección transversal), de modo que la geometría
 * de una pieza se define una sola vez. Todas las coordenadas van en cm.
 */
export interface PrimitivaBase {
  tono?: TonoPieza;
  /** Grosor del trazo en cm. */
  grosor?: number;
  trazo?: 'solida' | 'discontinua';
  opacidad?: number;
}

export type Primitiva =
  | (PrimitivaBase & { tipo: 'linea'; x1: number; y1: number; x2: number; y2: number })
  | (PrimitivaBase & { tipo: 'rect'; x: number; y: number; ancho: number; alto: number; radio?: number; relleno?: TonoPieza })
  | (PrimitivaBase & { tipo: 'poligono'; puntos: Punto[]; relleno?: TonoPieza })
  | (PrimitivaBase & { tipo: 'circulo'; cx: number; cy: number; radio: number; relleno?: TonoPieza })
  | (PrimitivaBase & { tipo: 'arco'; cx: number; cy: number; radio: number; inicio: number; fin: number });

export type OrientacionPiezaDibujo = 'horizontal' | 'vertical';

/**
 * Clase visual de una pieza. Es independiente de la categoría del catálogo:
 * dos REF con la misma clase comparten motor geométrico y cada sistema puede
 * aportar su propia definición más adelante.
 */
export type ClasePieza =
  | 'vidrio'
  | 'acrilico'
  | 'jamba'
  | 'cabezal'
  | 'sillar'
  | 'canal-u'
  | 'riel'
  | 'horizontal'
  | 'enganche'
  | 'traslape'
  | 'tubo'
  | 'pisavidrio'
  | 'adaptador'
  | 'empaque'
  | 'felpa'
  | 'rodachina'
  | 'manija'
  | 'seguro'
  | 'accesorio'
  | 'perfil';

export interface IdentidadPieza {
  clase: ClasePieza;
  /** Categoría del catálogo de perfiles (cabezal, jamba, canal-u...). */
  categoria: string;
  /** Sistema de ventanería (5020, 744, 8025...). */
  sistema: string;
  ref: string;
}

/**
 * Medidas transversales del perfil. Son proporciones físicas genéricas
 * (no medidas comerciales); cada REF o sistema podrá sobreescribirlas.
 */
export interface ParametrosPerfil {
  /** Espesor de la pared de aluminio. */
  pared: number;
  /** Profundidad de la garganta de vidrio. */
  garganta: number;
  /** Abertura de la garganta de vidrio. */
  boca: number;
  /** Longitud del inglete en los extremos (0 = corte recto). */
  inglete: number;
  /** Radio exterior del perfil. */
  radio: number;
}

export interface ContextoElevacion {
  pieza: PiezaPlano;
  /** Longitud de la pieza (eje del perfil). */
  largo: number;
  /** Peralte: ancho del perfil en la vista frontal. */
  peralte: number;
  orientacion: OrientacionPiezaDibujo;
  /** Lado del peralte hacia el que mira el interior/vidrio (-1 = extremo 0). */
  interior: -1 | 1;
  params: ParametrosPerfil;
  identidad: IdentidadPieza;
}

export interface ContextoSeccion {
  /** Ancho de la cara del perfil en la sección. */
  anchoCara: number;
  /** Profundidad del perfil (peralte). */
  peralte: number;
  interior: -1 | 1;
  params: ParametrosPerfil;
  identidad: IdentidadPieza;
}

export interface DefinicionPieza {
  etiqueta: string;
  elevacion: (ctx: ContextoElevacion) => Primitiva[];
  seccion?: (ctx: ContextoSeccion) => Primitiva[];
}
