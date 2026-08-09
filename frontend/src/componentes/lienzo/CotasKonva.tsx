import { Group, Line, Rect, Text } from 'react-konva';
import type { PiezaPlano } from '../../tipos';
import { PX_POR_CM } from '../../constantes';

export interface CotasKonvaProps {
  pieza: PiezaPlano;
  colorCota: string;
  colorFondo: string;
}

/**
 * Cotas de una pieza seleccionada: línea, marcas diagonales, y la etiqueta
 * centrada con las medidas en cm (verticales rotadas 90°).
 */
export default function CotasKonva({
  pieza,
  colorCota,
  colorFondo,
}: CotasKonvaProps): JSX.Element {
  const x = pieza.x * PX_POR_CM;
  const y = pieza.y * PX_POR_CM;
  const ancho = Math.max(0, pieza.anchoCm) * PX_POR_CM;
  const alto = Math.max(0, pieza.altoCm) * PX_POR_CM;
  const separacion = 18;
  const anchoCm = Math.round(Math.max(0, pieza.anchoCm) * 10) / 10;
  const altoCm = Math.round(Math.max(0, pieza.altoCm) * 10) / 10;
  const textoAncho = `${anchoCm} cm`;
  const textoAlto = `${altoCm} cm`;

  const cotaLine = (pts: number[]): JSX.Element => (
    <Line points={pts} stroke={colorCota} strokeWidth={1} listening={false} />
  );
  const marcaCota = (finX: number, finY: number): JSX.Element => (
    <Line
      points={[finX - 2.5, finY - 2.5, finX + 2.5, finY + 2.5]}
      stroke={colorCota}
      strokeWidth={1.2}
      listening={false}
    />
  );
  const cajaCota = (texto: string, centroX: number, centroY: number): JSX.Element => {
    const anchoCaja = texto.length * 6 + 10;
    return (
      <>
        <Rect
          x={centroX - anchoCaja / 2}
          y={centroY - 8}
          width={anchoCaja}
          height={16}
          fill={colorFondo}
          listening={false}
        />
        <Text
          x={centroX - anchoCaja / 2}
          y={centroY - 8}
          width={anchoCaja}
          height={16}
          text={texto}
          fontSize={11}
          fontStyle="bold"
          fill={colorCota}
          align="center"
          verticalAlign="middle"
          listening={false}
        />
      </>
    );
  };
  const cajaCotaVertical = (texto: string, lineaX: number, centroY: number): JSX.Element => (
    <Group x={lineaX} y={centroY} rotation={90} listening={false}>
      {cajaCota(texto, 0, 0)}
    </Group>
  );

  return (
    <>
      {/* Cota superior */}
      {cotaLine([x - 10, y - separacion, x + ancho + 10, y - separacion])}
      {cotaLine([x - 10, y - separacion, x - 10, y])}
      {cotaLine([x + ancho + 10, y - separacion, x + ancho + 10, y])}
      {marcaCota(x - 10, y - separacion)}
      {marcaCota(x + ancho + 10, y - separacion)}
      {cajaCota(textoAncho, x + ancho / 2, y - separacion - 7)}

      {/* Cota inferior */}
      {cotaLine([x - 10, y + alto + separacion, x + ancho + 10, y + alto + separacion])}
      {cotaLine([x - 10, y + alto, x - 10, y + alto + separacion])}
      {cotaLine([x + ancho, y + alto, x + ancho, y + alto + separacion])}
      {marcaCota(x - 10, y + alto + separacion)}
      {marcaCota(x + ancho + 10, y + alto + separacion)}
      {cajaCota(textoAncho, x + ancho / 2, y + alto + separacion + 7)}

      {/* Cota izquierda */}
      {cotaLine([x - separacion, y - 12, x - separacion, y + alto + 12])}
      {cotaLine([x - separacion, y - 12, x, y - 12])}
      {cotaLine([x - separacion, y + alto + 12, x, y + alto + 12])}
      {marcaCota(x - separacion, y - 12)}
      {marcaCota(x - separacion, y + alto + 12)}
      {cajaCotaVertical(textoAlto, x - separacion, y + alto / 2)}

      {/* Cota derecha */}
      {cotaLine([x + ancho + separacion, y - 12, x + ancho + separacion, y + alto + 12])}
      {cotaLine([x + ancho + separacion, y - 12, x + ancho, y - 12])}
      {cotaLine([x + ancho + separacion, y + alto + 12, x + ancho, y + alto + 12])}
      {marcaCota(x + ancho + separacion, y - 12)}
      {marcaCota(x + ancho + separacion, y + alto + 12)}
      {cajaCotaVertical(textoAlto, x + ancho + separacion, y + alto / 2)}
    </>
  );
}