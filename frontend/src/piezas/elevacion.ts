import type { PiezaPlano } from '../tipos';
import type { ContextoPiezaResuelto } from './contexto';
import { definicionDe } from './definiciones';
import type { ContextoElevacion, OrientacionPiezaDibujo, Primitiva } from './tipos';

/**
 * Primitivas de la elevación de una pieza (cm, en coordenadas locales de su
 * bounding box). Es la geometría que comparten el lienzo Konva, las
 * miniaturas de la lista de proyectos y la exportación a PDF.
 */
export function construirElevacion(
  pieza: PiezaPlano,
  contexto: ContextoPiezaResuelto,
): Primitiva[] {
  const esHorizontal = pieza.orientacion === 'horizontal';
  const orientacion: OrientacionPiezaDibujo = esHorizontal ? 'horizontal' : 'vertical';
  // El largo recorre el eje de la pieza y el peralte es su ancho de cara; en
  // el lienzo el largo es anchoCm (horizontal) o altoCm (vertical).
  const contextoElevacion: ContextoElevacion = {
    pieza,
    largo: esHorizontal ? pieza.anchoCm : pieza.altoCm,
    peralte: esHorizontal ? pieza.altoCm : pieza.anchoCm,
    orientacion,
    interior: contexto.interior,
    params: contexto.params,
    identidad: contexto.identidad,
  };
  return definicionDe(contexto.identidad).elevacion(contextoElevacion);
}
