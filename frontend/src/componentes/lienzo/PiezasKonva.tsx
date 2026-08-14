import { Rect, Circle } from 'react-konva';
import type { PiezaPlano } from '../../tipos';
import { PX_POR_CM } from '../../constantes';
import { radioSeguro } from '../../utils/geometria';

export interface PiezasKonvaProps {
  piezas: PiezaPlano[];
  piezaSeleccionadaId: string | null;
  idsSeleccionadas: string[];
  rectPreview: { x: number; y: number; ancho: number; alto: number } | null;
  herramienta: string;
  colorAcento: string;
  colorBorde: string;
  colorRelleno: string;
  colorVidrio: string;
}

/**
 * Capa principal del lienzo: piezas como rectángulos (o círculos para
 * elementos puntuales), el marco punteado de la pieza seleccionada y el
 * rectángulo de vista previa al arrastrar (dibujar o selección múltiple).
 * Todo es puramente visual (listening=false): la detección de clic/arrastre
 * se hace manualmente en LienzoPlano, fiable a cualquier zoom.
 */
export default function PiezasKonva({
  piezas,
  piezaSeleccionadaId,
  idsSeleccionadas,
  rectPreview,
  herramienta,
  colorAcento,
  colorBorde,
  colorRelleno,
  colorVidrio,
}: PiezasKonvaProps): JSX.Element {
  return (
    <>
      {piezaSeleccionadaId && (() => {
        const pieza = piezas.find((p) => p.id === piezaSeleccionadaId);
        if (!pieza) return null;
        const ancho = Math.max(0, pieza.anchoCm) * PX_POR_CM;
        const alto = Math.max(0, pieza.altoCm) * PX_POR_CM;
        return (
          <Rect
            x={pieza.x * PX_POR_CM - 3}
            y={pieza.y * PX_POR_CM - 3}
            width={ancho + 6}
            height={alto + 6}
            stroke={colorAcento}
            strokeWidth={1.5}
            dash={[4, 3]}
            cornerRadius={radioSeguro(ancho + 6, alto + 6, 2)}
            listening={false}
          />
        );
      })()}

      {piezas.map((pieza) => {
        const seleccionada =
          pieza.id === piezaSeleccionadaId || idsSeleccionadas.includes(pieza.id);
        const esPunto = pieza.orientacion === 'punto';
        const anchoPx = Math.max(0, pieza.anchoCm) * PX_POR_CM;
        const altoPx = Math.max(0, pieza.altoCm) * PX_POR_CM;
        if (esPunto) {
          return (
            <Circle
              key={pieza.id}
              x={(pieza.x + pieza.anchoCm / 2) * PX_POR_CM}
              y={(pieza.y + pieza.altoCm / 2) * PX_POR_CM}
              radius={5}
              fill={seleccionada ? colorAcento : colorRelleno}
              stroke={colorBorde}
              strokeWidth={1.5}
              listening={false}
            />
          );
        }
        const esVidrio = pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico';
        const fill = esVidrio ? colorVidrio : colorRelleno;
        return (
          <Rect
            key={pieza.id}
            x={pieza.x * PX_POR_CM}
            y={pieza.y * PX_POR_CM}
            width={anchoPx}
            height={altoPx}
            fill={seleccionada ? `${colorAcento}33` : fill}
            stroke={seleccionada ? colorAcento : colorBorde}
            strokeWidth={seleccionada ? 2 : 1}
            cornerRadius={radioSeguro(anchoPx, altoPx, 2)}
            listening={false}
          />
        );
      })}

      {rectPreview && (
        <Rect
          x={rectPreview.x}
          y={rectPreview.y}
          width={Math.max(0, rectPreview.ancho)}
          height={Math.max(0, rectPreview.alto)}
          fill={herramienta === 'seleccion' ? 'transparent' : `${colorAcento}18`}
          stroke={colorAcento}
          strokeWidth={1.5}
          dash={[6, 4]}
          cornerRadius={radioSeguro(Math.max(0, rectPreview.ancho), Math.max(0, rectPreview.alto), 2)}
          listening={false}
        />
      )}
    </>
  );
}
