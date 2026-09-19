import { useMemo } from 'react';
import { Rect } from 'react-konva';
import type { PerfilVentaneria, PiezaPlano } from '../../tipos';
import { PX_POR_CM } from '../../constantes';
import type { PaletaPiezas } from '../../utils/colores';
import { radioSeguro } from '../../utils/geometria';
import { crearContextosPiezas } from '../../piezas/contexto';
import PiezaKonva from '../../piezas/PiezaKonva';

export interface PiezasKonvaProps {
  piezas: PiezaPlano[];
  perfiles: PerfilVentaneria[];
  paleta: PaletaPiezas;
  piezaSeleccionadaId: string | null;
  idsSeleccionadas: string[];
  rectPreview: { x: number; y: number; ancho: number; alto: number } | null;
  herramienta: string;
  colorAcento: string;
}

/**
 * Capa principal del lienzo: cada pieza se dibuja con su geometría real
 * (perfiles, vidrios y herrajes) en el orden recibido (ya resuelto por
 * LienzoPlano, con la última pieza seleccionada encima), más el marco
 * punteado de la pieza seleccionada y el rectángulo de vista previa al
 * arrastrar (dibujar o selección múltiple). Todo es puramente visual
 * (listening=false): la detección de clic/arrastre se hace en LienzoPlano.
 */
export default function PiezasKonva({
  piezas,
  perfiles,
  paleta,
  piezaSeleccionadaId,
  idsSeleccionadas,
  rectPreview,
  herramienta,
  colorAcento,
}: PiezasKonvaProps): JSX.Element {
  const contextos = useMemo(
    () => crearContextosPiezas(piezas, perfiles),
    [piezas, perfiles],
  );

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
        const contexto = contextos.get(pieza.id);
        if (!contexto) return null;
        return (
          <PiezaKonva
            key={pieza.id}
            pieza={pieza}
            contexto={contexto}
            paleta={paleta}
            seleccionada={
              pieza.id === piezaSeleccionadaId || idsSeleccionadas.includes(pieza.id)
            }
            colorAcento={colorAcento}
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
