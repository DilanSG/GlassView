import type { HerramientaCad } from '../constantes';
import type { PerfilCategoria } from '../tipos';

export type InteraccionMover = {
  tipo: 'mover';
  idPieza: string;
  ids: string[];
  x0: number;
  y0: number;
  desplazamientoX: number;
  desplazamientoY: number;
  /** Posiciones originales de cada pieza del gesto: el arrastre siempre
   *  se calcula respecto a ellas (1:1 con el cursor, sin arrastre
   *  compuesto aunque React aún no haya commiteado el estado anterior). */
  origenPiezas: Record<string, { x: number; y: number }>;
};

export type InteraccionRedimensionar = {
  tipo: 'redimensionar';
  idPieza: string;
  esquina: string;
  x: number;
  y: number;
  ancho0: number;
  alto0: number;
};

export type Interaccion = InteraccionMover | InteraccionRedimensionar;

/** Estado del guardado en el servidor, visible dentro del lienzo. */
export type EstadoGuardado = 'sincronizado' | 'conCambios' | 'guardando' | 'error';

export interface RectanguloNuevo {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/** Devuelve la categoría de perfil asociada a una herramienta CAD. */
export function categoriaDeHerramienta(herramienta: HerramientaCad): PerfilCategoria {
  switch (herramienta) {
    case 'vidrio':
      return 'vidrio';
    case 'cabezal':
      return 'cabezal';
    case 'sillar':
      return 'sillar';
    case 'jamba':
      return 'jamba';
    case 'hoja':
      return 'hoja';
    case 'horizontal':
      return 'horizontal';
    case 'riel':
      return 'riel';
    case 'canal-u':
      return 'canal-u';
    case 'rodachina':
      return 'rodachina';
    case 'manija':
      return 'manija';
    default:
      return 'empaque';
  }
}