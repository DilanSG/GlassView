import { Rect, Line, Text } from 'react-konva';
import type { LineaRejilla, RangoMundo } from '../../hooks/useRejilla';
import { PX_POR_CM } from '../../constantes';

export interface RejillaKonvaProps {
  rangoMundo: RangoMundo;
  lineasRejilla: LineaRejilla[];
  colorFondo: string;
  colorRejillaFina: string;
  colorRejillaFuerte: string;
  colorEtiqueta: string;
}

/** Fondo del lienzo, líneas de rejilla y etiquetas de los ejes (cm). */
export default function RejillaKonva({
  rangoMundo,
  lineasRejilla,
  colorFondo,
  colorRejillaFina,
  colorRejillaFuerte,
  colorEtiqueta,
}: RejillaKonvaProps): JSX.Element {
  return (
    <>
      <Rect
        x={rangoMundo.xIzq}
        y={rangoMundo.ySup}
        width={rangoMundo.xDer - rangoMundo.xIzq}
        height={rangoMundo.yInf - rangoMundo.ySup}
        fill={colorFondo}
        cornerRadius={12}
        listening={false}
      />
      {lineasRejilla.map((linea, indice) => (
        <Line
          key={indice}
          points={[linea.x1, linea.y1, linea.x2, linea.y2]}
          stroke={linea.fuerte ? colorRejillaFuerte : colorRejillaFina}
          strokeWidth={linea.fuerte ? 1.5 : 1}
          listening={false}
        />
      ))}
      {lineasRejilla
        .filter(
          (linea) =>
            linea.fuerte &&
            linea.x1 === linea.x2 &&
            linea.x1 > rangoMundo.xIzq &&
            linea.y1 === rangoMundo.ySup,
        )
        .map((linea) => (
          <Text
            key={`etiqueta-x-${linea.x1}`}
            x={linea.x1 + 2}
            y={rangoMundo.ySup + 2}
            text={`${linea.x1 / PX_POR_CM}`}
            fontSize={10}
            fill={colorEtiqueta}
            listening={false}
          />
        ))}
      {lineasRejilla
        .filter(
          (linea) =>
            linea.fuerte &&
            linea.y1 === linea.y2 &&
            linea.y1 > rangoMundo.ySup &&
            linea.x1 === rangoMundo.xIzq,
        )
        .map((linea) => (
          <Text
            key={`etiqueta-y-${linea.y1}`}
            x={rangoMundo.xIzq + 2}
            y={linea.y1 + 2}
            text={`${linea.y1 / PX_POR_CM}`}
            fontSize={10}
            fill={colorEtiqueta}
            listening={false}
          />
        ))}
    </>
  );
}