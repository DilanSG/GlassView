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