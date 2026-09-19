import type { PaletaPiezas } from '../utils/colores';
import { GROSOR_FINO } from './primitivas';
import type { Primitiva } from './tipos';

function pintarPrimitiva(
  primitiva: Primitiva,
  indice: number,
  paleta: PaletaPiezas,
  escalaTrazo: number,
  trazoPantalla?: number,
): JSX.Element {
  const trazo = primitiva.tono ? paleta[primitiva.tono] : undefined;
  const relleno = 'relleno' in primitiva && primitiva.relleno ? paleta[primitiva.relleno] : undefined;
  const grosorBase = primitiva.grosor ?? GROSOR_FINO;
  const grosor =
    trazoPantalla !== undefined
      ? trazoPantalla * (grosorBase / GROSOR_FINO)
      : grosorBase * escalaTrazo;
  const dash =
    primitiva.trazo === 'discontinua'
      ? trazoPantalla !== undefined
        ? `${grosor * 4} ${grosor * 3}`
        : `${grosor * 5} ${grosor * 4}`
      : undefined;
  const comunes = {
    fill: relleno ?? 'none',
    stroke: trazo,
    strokeWidth: trazo ? grosor : 0,
    strokeDasharray: dash,
    opacity: primitiva.opacidad,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    vectorEffect: trazoPantalla !== undefined ? ('non-scaling-stroke' as const) : undefined,
  };

  switch (primitiva.tipo) {
    case 'linea':
      return (
        <line
          key={indice}
          x1={primitiva.x1}
          y1={primitiva.y1}
          x2={primitiva.x2}
          y2={primitiva.y2}
          {...comunes}
        />
      );
    case 'rect':
      return (
        <rect
          key={indice}
          x={primitiva.x}
          y={primitiva.y}
          width={primitiva.ancho}
          height={primitiva.alto}
          rx={primitiva.radio ?? 0}
          {...comunes}
        />
      );
    case 'poligono':
      return (
        <polygon
          key={indice}
          points={primitiva.puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')}
          {...comunes}
        />
      );
    case 'circulo':
      return (
        <circle
          key={indice}
          cx={primitiva.cx}
          cy={primitiva.cy}
          r={primitiva.radio}
          {...comunes}
        />
      );
    case 'arco': {
      const x1 = primitiva.cx + primitiva.radio * Math.cos(primitiva.inicio);
      const y1 = primitiva.cy + primitiva.radio * Math.sin(primitiva.inicio);
      const x2 = primitiva.cx + primitiva.radio * Math.cos(primitiva.fin);
      const y2 = primitiva.cy + primitiva.radio * Math.sin(primitiva.fin);
      const arcoGrande = Math.abs(primitiva.fin - primitiva.inicio) > Math.PI ? 1 : 0;
      const sentido = primitiva.fin > primitiva.inicio ? 1 : 0;
      const d = `M ${x1} ${y1} A ${primitiva.radio} ${primitiva.radio} 0 ${arcoGrande} ${sentido} ${x2} ${y2}`;
      return <path key={indice} d={d} {...comunes} fill="none" />;
    }
  }
}

export interface PrimitivasSvgProps {
  primitivas: Primitiva[];
  paleta: PaletaPiezas;
  /** Multiplica el grosor de los trazos (para miniaturas a escala reducida). */
  escalaTrazo?: number;
  /**
   * Grosor de trazo en píxeles de pantalla (no escala con el viewBox). Útil
   * para miniaturas: mantiene las líneas legibles sin importar el tamaño.
   */
  trazoPantalla?: number;
}

/** Dibuja una lista de primitivas como elementos SVG (coordenadas en cm). */
export default function PrimitivasSvg({
  primitivas,
  paleta,
  escalaTrazo = 1,
  trazoPantalla,
}: PrimitivasSvgProps): JSX.Element {
  return (
    <g>
      {primitivas.map((primitiva, indice) =>
        pintarPrimitiva(primitiva, indice, paleta, escalaTrazo, trazoPantalla),
      )}
    </g>
  );
}
