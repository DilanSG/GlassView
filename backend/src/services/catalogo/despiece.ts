/**
 * Cálculo del despiece de ventanería a partir de un modelo del catálogo.
 */
import type { FormulaMedida, ModeloVentaneria } from './tipos.js';

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function evaluarFormula(formula: FormulaMedida, ancho: number, alto: number): number {
  if (formula.base === 'fija') {
    return redondear(formula.resta / formula.divisor);
  }
  const base = formula.base === 'ancho' ? ancho : alto;
  return redondear((base - formula.resta) / formula.divisor);
}


export interface PiezaDespiece {
  ref: string;
  descripcion: string;
  medidaCm: number;
  cantidad: number;
  corteGrados: number;
  /** metros lineales totales (medida × cantidad / 100) */
  ml: number;
}

export interface VidrioDespiece {
  descripcion: string;
  material: 'vidrio' | 'acrilico';
  espesorMm: number;
  altoCm: number;
  anchoCm: number;
  cantidad: number;
}

export interface AccesorioDespiece {
  seccion: string;
  descripcion: string;
  cantidad: number;
}

export interface DespieceVentaneria {
  modeloId: string;
  modeloNombre: string;
  anchoCm: number;
  altoCm: number;
  areaM2: number;
  piezas: PiezaDespiece[];
  vidrios: VidrioDespiece[];
  empaqueMl: number;
  accesorios: AccesorioDespiece[];
  totalMl: number;
}

/**
 * Calcula el despiece completo de una ventana del modelo dado.
 * El empaque se deriva del perímetro de los vidrios (factor por modelo).
 */
export function calcularDespieceVentaneria(
  modelo: ModeloVentaneria,
  anchoCm: number,
  altoCm: number,
): DespieceVentaneria {
  const piezas = modelo.piezas.map((pieza) => {
    const medidaCm = evaluarFormula(pieza.medida, anchoCm, altoCm);
    return {
      ref: pieza.ref,
      descripcion: pieza.descripcion,
      medidaCm,
      cantidad: pieza.cantidad,
      corteGrados: pieza.corteGrados,
      ml: redondear((medidaCm * pieza.cantidad) / 100),
    };
  });

  const vidrios = modelo.vidrios.map((vidrio) => ({
    descripcion: vidrio.descripcion,
    material: vidrio.material,
    espesorMm: vidrio.espesorMm,
    altoCm: evaluarFormula(vidrio.alto, anchoCm, altoCm),
    anchoCm: evaluarFormula(vidrio.ancho, anchoCm, altoCm),
    cantidad: vidrio.cantidad,
  }));

  const perimetroVidrios = vidrios.reduce(
    (suma, vidrio) => suma + 2 * (vidrio.altoCm + vidrio.anchoCm) * vidrio.cantidad,
    0,
  );
  const empaqueMl = redondear(
    perimetroVidrios * modelo.empaqueFactor +
      modelo.empaqueExtraPorHoja * modelo.diseno.hojas.length,
  );

  const totalMl = redondear(piezas.reduce((suma, pieza) => suma + pieza.ml, 0));

  return {
    modeloId: modelo.id,
    modeloNombre: modelo.nombre,
    anchoCm,
    altoCm,
    areaM2: redondear((anchoCm * altoCm) / 10000),
    piezas,
    vidrios,
    empaqueMl,
    accesorios: modelo.accesorios,
    totalMl,
  };
}

