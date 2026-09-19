import { useMemo } from 'react';
import { Shape } from 'react-konva';
import type Konva from 'konva';
import { PX_POR_CM } from '../constantes';
import type { PiezaPlano } from '../tipos';
import type { PaletaPiezas } from '../utils/colores';
import type { ContextoPiezaResuelto } from './contexto';
import { construirElevacion } from './elevacion';
import { dibujarPrimitivas, recortarRectangulo, rellenarRectangulo, type ContextoDibujo } from './primitivas';
import type { Primitiva } from './tipos';

export interface PiezaKonvaProps {
  pieza: PiezaPlano;
  contexto: ContextoPiezaResuelto;
  paleta: PaletaPiezas;
  seleccionada: boolean;
  colorAcento: string;
}

/** Radio de recorte del contorno de una pieza (suaviza esquinas exteriores). */
function radioRecorte(pieza: PiezaPlano): number {
  return Math.min(0.2, pieza.anchoCm / 6, pieza.altoCm / 6);
}

/**
 * Dibuja una pieza con su geometría propia (perfil, vidrio o herraje) dentro
 * de su bounding box. El contorno del bbox solo se usa para recortar y
 * resaltar: la forma visible sale de las definiciones geométricas.
 */
export default function PiezaKonva({
  pieza,
  contexto,
  paleta,
  seleccionada,
  colorAcento,
}: PiezaKonvaProps): JSX.Element {
  const primitivas = useMemo<Primitiva[]>(
    () => construirElevacion(pieza, contexto),
    [pieza, contexto],
  );

  const ancho = pieza.anchoCm;
  const alto = pieza.altoCm;
  const radio = radioRecorte(pieza);

  return (
    <Shape
      x={pieza.x * PX_POR_CM}
      y={pieza.y * PX_POR_CM}
      scaleX={PX_POR_CM}
      scaleY={PX_POR_CM}
      listening={false}
      perfectDrawEnabled={false}
      sceneFunc={(contextoKonva: Konva.Context) => {
        const ctx = contextoKonva as unknown as ContextoDibujo;
        ctx.save();
        recortarRectangulo(ctx, 0, 0, ancho, alto, radio);
        dibujarPrimitivas(ctx, primitivas, paleta);
        if (seleccionada) {
          rellenarRectangulo(ctx, 0, 0, ancho, alto, radio, colorAcento, 0.16);
        }
        ctx.restore();
      }}
    />
  );
}
