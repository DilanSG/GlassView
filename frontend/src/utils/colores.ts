/** Lee una variable CSS del documento con un valor de respaldo. */
export function obtenerColorVar(nombre: string, alternativo: string): string {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nombre)
    .trim();
  return valor || alternativo;
}

export interface ColoresLienzo {
  fondo: string;
  relleno: string;
  borde: string;
  texto: string;
  acento: string;
  vidrio: string;
  rejillaFina: string;
  rejillaFuerte: string;
  etiqueta: string;
}

/** Paleta de colores del lienzo, leída de las variables CSS del tema. */
export function obtenerColoresLienzo(): ColoresLienzo {
  return {
    fondo: obtenerColorVar('--bg-secondary', '#ebebef'),
    relleno: obtenerColorVar('--bg-tertiary', '#dddde3'),
    borde: obtenerColorVar('--border-strong', '#aeaeb2'),
    texto: obtenerColorVar('--text-primary', '#1c1c1e'),
    acento: '#2e7d32',
    vidrio: 'rgba(78, 165, 217, 0.30)',
    rejillaFina: obtenerColorVar('--linea-fina', 'rgba(0,0,0,0.06)'),
    rejillaFuerte: obtenerColorVar('--linea-fuerte', 'rgba(0,0,0,0.12)'),
    etiqueta: obtenerColorVar('--text-tertiary', '#86878c'),
  };
}