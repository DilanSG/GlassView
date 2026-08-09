/** Trunca un valor en píxeles a un múltiplo de la unidad dada (p. ej., la rejilla). */
export function redondearAPx(valorPx: number, unidad: number): number {
  return Math.max(0, Math.round(valorPx / unidad) * unidad);
}

/**
 * Konva calcula el radio de una esquina redondeada como
 * min(cornerRadius, ancho/2, alto/2); si la pieza tiene medidas
 * fraccionarias o degeneradas el radio puede quedar negativo y
 * `ctx.arc` lanza un IndexSizeError. Se recorta siempre a un valor seguro.
 */
export function radioSeguro(anchoPx: number, altoPx: number, radio: number): number {
  return Math.max(0, Math.min(radio, anchoPx / 2, altoPx / 2));
}

/** Convierte el texto de un input a cm válidos (≥ 0.1, paso 0.1). */
export function valorCm(texto: string): number | null {
  const numero = Number(texto.replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) return null;
  return Math.max(0.1, Math.round(numero * 10) / 10);
}

/** Redondea un número en cm a 1 decimal y lo devuelve como numérico. */
export function redondearCm(valor: number): number {
  return Math.round(valor * 10) / 10;
}