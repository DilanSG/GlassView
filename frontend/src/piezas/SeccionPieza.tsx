import { useId, useMemo } from 'react';
import type { PiezaPlano } from '../tipos';
import { obtenerPaletaPiezas } from '../utils/colores';
import { definicionDe } from './definiciones';
import PrimitivasSvg from './PrimitivasSvg';
import { dimensionesSeccionDePieza, dimensionesSeccionPrevia } from './resolver';
import type { IdentidadPieza, ParametrosPerfil } from './tipos';

export interface SeccionPiezaProps {
  identidad: IdentidadPieza;
  params: ParametrosPerfil;
  interior?: -1 | 1;
  /** Pieza real: usa sus medidas. Si falta, se usa una sección de referencia. */
  pieza?: PiezaPlano;
  ancho?: number;
  alto?: number;
  /** Multiplica el grosor de los trazos (para mejorar el contraste). */
  escalaTrazo?: number;
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
  escalaTrazo = 1,
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
        <PrimitivasSvg primitivas={primitivas} paleta={paleta} escalaTrazo={escalaTrazo} />
      </g>
    </svg>
  );
}
