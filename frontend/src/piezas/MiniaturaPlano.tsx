import { useMemo } from 'react';
import type { HuecoProyecto, PerfilVentaneria, PiezaPlano } from '../tipos';
import { obtenerPaletaPiezas } from '../utils/colores';
import { crearContextosPiezas } from './contexto';
import { construirElevacion } from './elevacion';
import type { Primitiva } from './tipos';
import PrimitivasSvg from './PrimitivasSvg';

export interface MiniaturaPlanoProps {
  piezas: PiezaPlano[];
  perfiles: PerfilVentaneria[];
  hueco?: HuecoProyecto | null;
}

interface PiezaDibujo {
  id: string;
  x: number;
  y: number;
  primitivas: Primitiva[];
}

/**
 * Vista previa de un plano con la geometría real de las piezas (perfiles con
 * su garganta, vidrios translúcidos y herrajes), encuadrada a su bounding box
 * y, si el proyecto tiene hueco, con el contorno del vano.
 */
export default function MiniaturaPlano({ piezas, perfiles, hueco }: MiniaturaPlanoProps) {
  const paleta = useMemo(() => obtenerPaletaPiezas(), []);

  const dibujos = useMemo<PiezaDibujo[]>(() => {
    const contextos = crearContextosPiezas(piezas, perfiles);
    return piezas.map((pieza) => ({
      id: pieza.id,
      x: pieza.x,
      y: pieza.y,
      primitivas: construirElevacion(pieza, contextos.get(pieza.id)!),
    }));
  }, [piezas, perfiles]);

  const vista = useMemo(() => {
    if (piezas.length === 0 && !hueco) {
      return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (hueco && hueco.anchoCm > 0 && hueco.altoCm > 0) {
      minX = Math.min(minX, 0);
      minY = Math.min(minY, 0);
      maxX = Math.max(maxX, hueco.anchoCm);
      maxY = Math.max(maxY, hueco.altoCm);
    }

    for (const pieza of piezas) {
      minX = Math.min(minX, pieza.x);
      minY = Math.min(minY, pieza.y);
      maxX = Math.max(maxX, pieza.x + pieza.anchoCm);
      maxY = Math.max(maxY, pieza.y + pieza.altoCm);
    }

    if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
      return null;
    }

    const ancho = Math.max(1, maxX - minX);
    const alto = Math.max(1, maxY - minY);
    const margen = Math.max(3, Math.max(ancho, alto) * 0.05);

    return {
      viewBox: `${minX - margen} ${minY - margen} ${ancho + margen * 2} ${alto + margen * 2}`,
    };
  }, [piezas, hueco]);

  if (!vista) {
    return (
      <div className="miniatura-plano">
        <span className="miniatura-plano-vacio">Sin piezas aún</span>
      </div>
    );
  }

  return (
    <div className="miniatura-plano">
      <svg viewBox={vista.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        {hueco && hueco.anchoCm > 0 && hueco.altoCm > 0 && (
          <rect
            x={0}
            y={0}
            width={hueco.anchoCm}
            height={hueco.altoCm}
            className="miniatura-hueco"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {dibujos.map((dibujo) => (
          <g key={dibujo.id} transform={`translate(${dibujo.x} ${dibujo.y})`}>
            <PrimitivasSvg primitivas={dibujo.primitivas} paleta={paleta} trazoPantalla={1.1} />
          </g>
        ))}
      </svg>
    </div>
  );
}
