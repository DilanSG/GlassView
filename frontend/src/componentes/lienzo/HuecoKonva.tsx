import { Group, Rect, Text } from 'react-konva';
import { PX_POR_CM } from '../../constantes';

export interface HuecoKonvaProps {
  anchoCm: number;
  altoCm: number;
  colorEtiqueta: string;
  colorFondo: string;
}

/**
 * Hueco de obra: fuera del vano se tapa la rejilla con el color de fondo, de
 * modo que el área de dibujo disponible es exactamente el hueco. Solo se
 * rotula la medida; el borde queda marcado por el cambio de textura.
 */
export default function HuecoKonva({
  anchoCm,
  altoCm,
  colorEtiqueta,
  colorFondo,
}: HuecoKonvaProps): JSX.Element {
  const ancho = anchoCm * PX_POR_CM;
  const alto = altoCm * PX_POR_CM;
  const infinito = 100000;

  return (
    <Group listening={false}>
      {/* Fuera del hueco no hay rejilla: solo el área del vano es dibujable. */}
      <Rect x={-infinito} y={-infinito} width={infinito * 2 + ancho} height={infinito} fill={colorFondo} listening={false} />
      <Rect x={-infinito} y={alto} width={infinito * 2 + ancho} height={infinito} fill={colorFondo} listening={false} />
      <Rect x={-infinito} y={0} width={infinito} height={alto} fill={colorFondo} listening={false} />
      <Rect x={ancho} y={0} width={infinito} height={alto} fill={colorFondo} listening={false} />

      <Text
        x={0}
        y={-22}
        text={`Hueco ${anchoCm} × ${altoCm} cm`}
        fontSize={13}
        fontStyle="bold"
        fill={colorEtiqueta}
        listening={false}
      />
    </Group>
  );
}
