import { useId, useMemo } from 'react';
import type { PiezaPlano } from '../tipos';
import { obtenerPaletaPiezas, type PaletaPiezas } from '../utils/colores';
import { definicionDe } from './definiciones';
import { GROSOR_FINO } from './primitivas';
import { dimensionesSeccionDePieza, dimensionesSeccionPrevia } from './resolver';
import type { IdentidadPieza, ParametrosPerfil, Primitiva } from './tipos';

export interface SeccionPiezaProps {
  identidad: IdentidadPieza;
  params: ParametrosPerfil;
  interior?: -1 | 1;
  /** Pieza real: usa sus medidas. Si falta, se usa una sección de referencia. */
  pieza?: PiezaPlano;
  ancho?: number;
  alto?: number;
}

function pintarPrimitiva(primitiva: Primitiva, indice: number, paleta: PaletaPiezas): JSX.Element {
  const trazo = primitiva.tono ? paleta[primitiva.tono] : undefined;
  const relleno = 'relleno' in primitiva && primitiva.relleno ? paleta[primitiva.relleno] : undefined;
  const grosor = primitiva.grosor ?? GROSOR_FINO;
  const dash = primitiva.trazo === 'discontinua' ? `${grosor * 5} ${grosor * 4}` : undefined;
  const comunes = {
    fill: relleno ?? 'none',
    stroke: trazo,
    strokeWidth: trazo ? grosor : 0,
    strokeDasharray: dash,
    opacity: primitiva.opacidad,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
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

/**
 * Sección transversal de una pieza (o de una REF del catálogo) dibujada con
 * las mismas primitivas que la elevación del lienzo. Sirve para que el usuario
 * reconozca la forma real del perfil.
 */
export default function SeccionPieza({
  identidad,
  params,
  interior = 1,
  pieza,
  ancho = 96,
  alto = 72,
}: SeccionPiezaProps): JSX.Element {
  const idRecorte = useId();
  const paleta = useMemo(() => obtenerPaletaPiezas(), []);

  const { primitivas, anchoCara, peralte } = useMemo(() => {
    const definicion = definicionDe(identidad);
    const dimensiones = pieza
      ? dimensionesSeccionDePieza(pieza, identidad)
      : dimensionesSeccionPrevia(identidad);

    if (definicion.seccion) {
      return {
        primitivas: definicion.seccion({ ...dimensiones, interior, params, identidad }),
        ...dimensiones,
      };
    }

    const piezaBase: PiezaPlano = pieza ?? {
      id: 'previa',
      tipo: 'perfil',
      ref: identidad.ref,
      descripcion: '',
      x: 0,
      y: 0,
      largoCm: 0,
      anchoCm: dimensiones.anchoCara,
      altoCm: dimensiones.peralte,
      orientacion: 'horizontal',
      espesorMm: 0,
      cantidad: 1,
    };
    return {
      primitivas: definicion.elevacion({
        pieza: piezaBase,
        largo: dimensiones.anchoCara,
        peralte: dimensiones.peralte,
        orientacion: 'horizontal',
        interior,
        params,
        identidad,
      }),
      ...dimensiones,
    };
  }, [identidad, params, interior, pieza]);

  const margen = Math.max(anchoCara, peralte) * 0.1;
  const viewBox = `${-margen} ${-margen} ${anchoCara + margen * 2} ${peralte + margen * 2}`;

  return (
    <svg
      className="seccion-pieza"
      width={ancho}
      height={alto}
      viewBox={viewBox}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Sección de ${identidad.clase}`}
    >
      <clipPath id={idRecorte}>
        <rect x={-margen} y={-margen} width={anchoCara + margen * 2} height={peralte + margen * 2} />
      </clipPath>
      <g clipPath={`url(#${idRecorte})`}>
        {primitivas.map((primitiva, indice) => pintarPrimitiva(primitiva, indice, paleta))}
      </g>
    </svg>
  );
}
