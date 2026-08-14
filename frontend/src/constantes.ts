/** Escala del lienzo: cada centímetro real equivale a este número de píxeles. */
export const PX_POR_CM = 10;

/** Tamaño (px) de las asas de las esquinas al redimensionar una pieza. */
export const TAMANO_ASA = 10;

/** Mínimo en pantalla (px) que debe ocupar una pieza para poder pulsarla. */
export const MINIMO_SELECCION_PANTALLA = 14;

export const ZOOM_MIN = 0.2;
export const ZOOM_MAX = 3;

export type HerramientaCad =
  | 'seleccion'
  | 'mano'
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
  | 'empaque';

export interface HerramientaInfo {
  id: HerramientaCad;
  nombre: string;
}

export const HERRAMIENTAS: HerramientaInfo[] = [
  { id: 'seleccion', nombre: 'Seleccionar' },
  { id: 'mano', nombre: 'Desplazar plano' },
  { id: 'vidrio', nombre: 'Vidrio' },
  { id: 'cabezal', nombre: 'Cabezal' },
  { id: 'sillar', nombre: 'Sillar' },
  { id: 'jamba', nombre: 'Jamba' },
  { id: 'hoja', nombre: 'Enganche/Traslape' },
  { id: 'horizontal', nombre: 'Horizontal' },
  { id: 'riel', nombre: 'Riel' },
  { id: 'canal-u', nombre: 'U' },
  { id: 'rodachina', nombre: 'Rodachina' },
  { id: 'manija', nombre: 'Manija' },
  { id: 'empaque', nombre: 'Empaque/Felpa' },
];