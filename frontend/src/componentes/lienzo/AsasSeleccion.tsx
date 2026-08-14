import { Circle, Line, Rect } from 'react-konva';
import type { PiezaPlano } from '../../tipos';
import { PX_POR_CM, TAMANO_ASA } from '../../constantes';
import { radioSeguro } from '../../utils/geometria';

export interface AsasSeleccionProps {
  pieza: PiezaPlano;
  zoom: number;
  colorAcento: string;
  colorBorde: string;
  colorTexto: string;
}

export const ESQUINAS_ASAS = [
  { id: 'sup-izq', xOff: 0, yOff: 0 },
  { id: 'sup', xOff: 0.5, yOff: 0 },
  { id: 'sup-der', xOff: 1, yOff: 0 },
  { id: 'der', xOff: 1, yOff: 0.5 },
  { id: 'inf-der', xOff: 1, yOff: 1 },
  { id: 'inf', xOff: 0.5, yOff: 1 },
  { id: 'inf-izq', xOff: 0, yOff: 1 },
  { id: 'izq', xOff: 0, yOff: 0.5 },
] as const;

/** Asas de redimensionado en el borde de la pieza y asa central (medidor). */
export default function AsasSeleccion({
  pieza,
  zoom,
  colorAcento,
  colorBorde,
  colorTexto,
}: AsasSeleccionProps): JSX.Element {
  const x = pieza.x * PX_POR_CM;
  const y = pieza.y * PX_POR_CM;
  const ancho = pieza.anchoCm * PX_POR_CM;
  const alto = pieza.altoCm * PX_POR_CM;
  /** Tamaño del asa en coordenadas de mundo: constante en pantalla (10 px). */
  const tamanoAsa = Math.max(4, TAMANO_ASA / zoom);

  return (
    <>
      {ESQUINAS_ASAS.map((esquina) => (
        <Rect
          key={`asa-${esquina.id}`}
          x={x + ancho * esquina.xOff - tamanoAsa / 2}
          y={y + alto * esquina.yOff - tamanoAsa / 2}
          width={tamanoAsa}
          height={tamanoAsa}
          fill={colorBorde}
          stroke={colorTexto}
          strokeWidth={1}
          cornerRadius={radioSeguro(tamanoAsa, tamanoAsa, 2)}
          listening={false}
        />
      ))}
      <Circle
        key="asa-central"
        x={x + ancho / 2}
        y={y + alto / 2}
        radius={9}
        fill={`${colorAcento}2e`}
        stroke={colorAcento}
        strokeWidth={1.5}
        listening={false}
      />
      <Line
        listening={false}
        points={[x + ancho / 2 - 7, y + alto / 2, x + ancho / 2 + 7, y + alto / 2]}
        stroke={colorTexto}
        strokeWidth={2}
        perfectDrawEnabled={false}
      />
      <Line
        listening={false}
        points={[x + ancho / 2, y + alto / 2 - 7, x + ancho / 2, y + alto / 2 + 7]}
        stroke={colorTexto}
        strokeWidth={2}
        perfectDrawEnabled={false}
      />
    </>
  );
}