import { useMemo } from 'react';
import type { PiezaPlano } from '../tipos';
import type { VistaPlano } from './useZoomPan';
import { PX_POR_CM } from '../constantes';

export interface RangoMundo {
  xIzq: number;
  xDer: number;
  ySup: number;
  yInf: number;
}

export interface LineaRejilla {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fuerte: boolean;
}

export interface UseRejillaResultado {
  rangoMundo: RangoMundo;
  lineasRejilla: LineaRejilla[];
}

/**
 * Rango visible del mundo (contando el zoom y el desplazamiento) y las líneas
 * de rejilla que se dibujan dentro de ese rango. El rango se extiende para
 * cubrir también las piezas: el fondo y la rejilla deben llegar hasta el
 * contenido aunque el viewport no lo esté mostrando. La rejilla marca un
 * cuadrado por centímetro y una línea fuerte cada 10 cm.
 */
export function useRejilla(
  piezas: PiezaPlano[],
  vista: VistaPlano,
  tamanoVista: { ancho: number; alto: number },
): UseRejillaResultado {
  const rangoMundo = useMemo(() => {
    const zoomSeguro = Math.max(vista.zoom, 0.01);
    let xIzq = -vista.x / zoomSeguro;
    let xDer = (tamanoVista.ancho - vista.x) / zoomSeguro;
    let ySup = -vista.y / zoomSeguro;
    let yInf = (tamanoVista.alto - vista.y) / zoomSeguro;
    for (const pieza of piezas) {
      xDer = Math.max(xDer, (pieza.x + pieza.anchoCm) * PX_POR_CM);
      yInf = Math.max(yInf, (pieza.y + pieza.altoCm) * PX_POR_CM);
      xIzq = Math.min(xIzq, pieza.x * PX_POR_CM);
      ySup = Math.min(ySup, pieza.y * PX_POR_CM);
    }
    const margen = PX_POR_CM * 6;
    xIzq = Math.floor((xIzq - margen) / PX_POR_CM) * PX_POR_CM;
    ySup = Math.floor((ySup - margen) / PX_POR_CM) * PX_POR_CM;
    xDer = Math.ceil((xDer + margen) / PX_POR_CM) * PX_POR_CM;
    yInf = Math.ceil((yInf + margen) / PX_POR_CM) * PX_POR_CM;
    return { xIzq, xDer, ySup, yInf };
  }, [piezas, tamanoVista, vista]);

  const lineasRejilla = useMemo(() => {
    const lineas: LineaRejilla[] = [];
    for (let x = rangoMundo.xIzq; x <= rangoMundo.xDer; x += PX_POR_CM) {
      if (x === 0) continue;
      lineas.push({ x1: x, y1: rangoMundo.ySup, x2: x, y2: rangoMundo.yInf, fuerte: x % 100 === 0 });
    }
    for (let y = rangoMundo.ySup; y <= rangoMundo.yInf; y += PX_POR_CM) {
      if (y === 0) continue;
      lineas.push({ x1: rangoMundo.xIzq, y1: y, x2: rangoMundo.xDer, y2: y, fuerte: y % 100 === 0 });
    }
    return lineas;
  }, [rangoMundo]);

  return { rangoMundo, lineasRejilla };
}