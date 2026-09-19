function localeNavegador(): string {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'es';
}

/** Monedas que se muestran sin decimales (el backend las redondea igual). */
const MONEDAS_SIN_DECIMALES = new Set(['COP', 'CLP', 'PYG', 'VES', 'JPY', 'KRW', 'VND', 'IDR']);

/**
 * Formatea un importe con la denominación de la moneda (COP, USD, BRL...)
 * en lugar del símbolo, para que no se confundan monedas que comparten "$".
 */
export function formatearMoneda(valor: number, moneda: string, locale = localeNavegador()): string {
  const decimales = MONEDAS_SIN_DECIMALES.has(moneda) ? 0 : 2;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: moneda,
      currencyDisplay: 'code',
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales,
    }).format(valor);
  } catch {
    return `${moneda} ${valor.toFixed(decimales)}`;
  }
}

/** Formatea una fecha ISO como día, mes y año. */
export function formatearFecha(fecha?: string | null): string {
  if (!fecha) {
    return '—';
  }
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return '—';
  }
  return valor.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** Convierte una fecha a `yyyy-mm-dd` para los campos de tipo fecha. */
export function aFechaInput(fecha?: string | null): string {
  if (!fecha) {
    return '';
  }
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return '';
  }
  return valor.toISOString().slice(0, 10);
}
