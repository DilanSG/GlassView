import type { FormaPieza, TipoPiezaPersonalizada } from '../tipos';
import type { Primitiva, TonoPieza } from './tipos';
import { poligono } from './primitivas';
import { oscurecerColor } from '../utils/colores';

interface TonosForma {
  contorno: TonoPieza;
  borde: TonoPieza;
  vacio: TonoPieza;
  vacioBorde: TonoPieza;
}

const TONOS: Record<TipoPiezaPersonalizada, TonosForma> = {
  perfil: { contorno: 'perfil', borde: 'perfilBorde', vacio: 'perfilOscuro', vacioBorde: 'perfilDetalle' },
  vidrio: { contorno: 'vidrio', borde: 'vidrioBorde', vacio: 'vidrioBrillo', vacioBorde: 'vidrioBorde' },
  acrilico: { contorno: 'acrilico', borde: 'acrilicoBorde', vacio: 'vidrioBrillo', vacioBorde: 'acrilicoBorde' },
  herraje: { contorno: 'herraje', borde: 'herrajeOscuro', vacio: 'herrajeOscuro', vacioBorde: 'herrajeOscuro' },
};

export function formaValida(forma?: FormaPieza | null): forma is FormaPieza {
  return Boolean(
    forma &&
      forma.trazos.some(
        (trazo) =>
          trazo.rol === 'contorno' &&
          trazo.cerrado !== false &&
          trazo.puntos.length >= 3,
      ),
  );
}

function tonosDe(tipo: string): TonosForma {
  return TONOS[tipo as TipoPiezaPersonalizada] ?? TONOS.perfil;
}

/**
 * Convierte la forma libre en primitivas: los contornos primero y encima los
 * vacíos, escalando del lienzo de diseño al rectángulo real de la pieza. Los
 * trazos todavía en curso (`cerrado: false`) no se pintan: la figura aparece
 * cuando el usuario la cierra. Cada capa puede traer su propio material; si no
 * lo trae, se usa el color del material general de la pieza.
 */
export function primitivasDeForma(
  forma: FormaPieza,
  anchoCm: number,
  altoCm: number,
  tipo: string,
): Primitiva[] {
  const tonos = tonosDe(tipo);
  const escalaX = forma.anchoCm > 0 ? anchoCm / forma.anchoCm : 1;
  const escalaY = forma.altoCm > 0 ? altoCm / forma.altoCm : 1;
  const cerradas = forma.trazos.filter(
    (trazo) => trazo.visible !== false && trazo.cerrado !== false && trazo.puntos.length >= 3,
  );
  const contornos = cerradas.filter((trazo) => trazo.rol !== 'vacio');
  const vacios = cerradas.filter((trazo) => trazo.rol === 'vacio');

  const estilo = (trazo: (typeof cerradas)[number]) => {
    const color = trazo.material?.color ?? forma.color;
    if (trazo.rol === 'vacio') {
      return color
        ? { rellenoColor: oscurecerColor(color, 0.45), tonoColor: oscurecerColor(color, 0.6), grosor: 0.06 }
        : { relleno: tonos.vacio, tono: tonos.vacioBorde, grosor: 0.06 };
    }
    return color
      ? { rellenoColor: color, tonoColor: oscurecerColor(color, 0.35), grosor: 0.08 }
      : { relleno: tonos.contorno, tono: tonos.borde, grosor: 0.08 };
  };

  return [...contornos, ...vacios].map((trazo) =>
    poligono(
      trazo.puntos.map((punto) => ({ x: punto.x * escalaX, y: punto.y * escalaY })),
      estilo(trazo),
    ),
  );
}
