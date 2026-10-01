import { useMemo } from 'react';
import type { FormaPieza, TipoPiezaPersonalizada } from '../../tipos';
import { primitivasDeForma } from '../../piezas/formas';
import PrimitivasSvg from '../../piezas/PrimitivasSvg';
import { obtenerPaletaPiezas } from '../../utils/colores';

/** Vista previa en miniatura de la forma de una pieza. */
export default function MiniaturaForma({
  forma,
  tipo,
}: {
  forma: FormaPieza;
  tipo: TipoPiezaPersonalizada;
}) {
  const paleta = useMemo(() => obtenerPaletaPiezas(), []);
  const primitivas = useMemo(
    () => primitivasDeForma(forma, forma.anchoCm, forma.altoCm, tipo),
    [forma, tipo],
  );
  const margen = Math.max(forma.anchoCm, forma.altoCm) * 0.06;
  return (
    <svg
      className="miniatura-forma"
      viewBox={`${-margen} ${-margen} ${forma.anchoCm + margen * 2} ${forma.altoCm + margen * 2}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <PrimitivasSvg primitivas={primitivas} paleta={paleta} escalaTrazo={1} />
    </svg>
  );
}
