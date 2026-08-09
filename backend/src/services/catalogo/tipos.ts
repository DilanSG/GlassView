/**
 * Tipos compartidos del catálogo de modelos de ventanería, extraído de
 * «descuentos de ventanería.xlsx».
 *
 * Cada modelo define las fórmulas de corte de sus perfiles (REF), los vidrios
 * y los accesorios. Las fórmulas se expresan como operaciones sobre el ancho
 * y el alto (en centímetros) de la ventana:
 *
 *   base:  'ancho' | 'alto' | 'fija'
 *   resta: valor que se resta a la base (o el valor fijo cuando base es 'fija')
 *   divisor: divisor de la operación
 *
 * Ejemplo: HORIZONTAL 5020-2 = (ancho - 2.8) / 2
 */

export type BaseMedida = 'ancho' | 'alto' | 'fija';

export interface FormulaMedida {
  base: BaseMedida;
  resta: number;
  divisor: number;
}

export interface PiezaModelo {
  ref: string;
  descripcion: string;
  medida: FormulaMedida;
  cantidad: number;
  corteGrados: number;
}

export interface VidrioModelo {
  descripcion: string;
  material: 'vidrio' | 'acrilico';
  espesorMm: number;
  alto: FormulaMedida;
  ancho: FormulaMedida;
  cantidad: number;
}

export interface AccesorioModelo {
  seccion: string;
  descripcion: string;
  cantidad: number;
}

export interface HojaDiseno {
  tipo: 'corredera' | 'fija' | 'batiente' | 'basculante';
  proporcion: number;
}

export interface DisenoVentaneria {
  tipo: 'corredera' | 'fijo' | 'batiente' | 'basculante' | 'divibano' | 'alacena';
  /** true cuando las hojas se apilan en vertical (p. ej. basculantes bajo un fijo) */
  apiladas: boolean;
  hojas: HojaDiseno[];
}

export interface ModeloVentaneria {
  id: string;
  nombre: string;
  sistema: string;
  diseno: DisenoVentaneria;
  /** medidas de ejemplo tomadas del Excel (ancho × alto en cm) */
  ejemplo: { ancho: number; alto: number };
  piezas: PiezaModelo[];
  vidrios: VidrioModelo[];
  empaqueTipo: string;
  /** multiplicador del empaque respecto al perímetro de vidrios */
  empaqueFactor: number;
  /** empaque adicional por hoja (solo modelos P.B.) */
  empaqueExtraPorHoja: number;
  accesorios: AccesorioModelo[];
}

export const a = (resta = 0, divisor = 1): FormulaMedida => ({ base: 'ancho', resta, divisor });
export const h = (resta = 0, divisor = 1): FormulaMedida => ({ base: 'alto', resta, divisor });
export const f = (valor: number): FormulaMedida => ({ base: 'fija', resta: valor, divisor: 1 });

export function p(
  ref: string,
  descripcion: string,
  medida: FormulaMedida,
  cantidad: number,
  corteGrados = 90,
): PiezaModelo {
  return { ref, descripcion, medida, cantidad, corteGrados };
}

export function v(
  descripcion: string,
  material: 'vidrio' | 'acrilico',
  espesorMm: number,
  alto: FormulaMedida,
  ancho: FormulaMedida,
  cantidad: number,
): VidrioModelo {
  return { descripcion, material, espesorMm, alto, ancho, cantidad };
}