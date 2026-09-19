/** Lee una variable CSS del documento con un valor de respaldo. */
export function obtenerColorVar(nombre: string, alternativo: string): string {
  const valor = getComputedStyle(document.documentElement)
    .getPropertyValue(nombre)
    .trim();
  return valor || alternativo;
}

/** Colores de los materiales de las piezas (aluminio, vidrio, herrajes...). */
export interface PaletaPiezas {
  perfil: string;
  perfilClaro: string;
  perfilOscuro: string;
  perfilBorde: string;
  perfilDetalle: string;
  corte: string;
  vidrio: string;
  vidrioBorde: string;
  vidrioBrillo: string;
  acrilico: string;
  acrilicoBorde: string;
  herraje: string;
  herrajeClaro: string;
  herrajeOscuro: string;
  empaque: string;
}

/** Lee de las variables CSS la paleta de materiales del tema actual. */
export function obtenerPaletaPiezas(): PaletaPiezas {
  return {
    perfil: obtenerColorVar('--aluminio', '#d7dade'),
    perfilClaro: obtenerColorVar('--aluminio-claro', '#e9ebee'),
    perfilOscuro: obtenerColorVar('--aluminio-oscuro', '#b6bac0'),
    perfilBorde: obtenerColorVar('--aluminio-borde', '#82878e'),
    perfilDetalle: obtenerColorVar('--aluminio-detalle', '#6c7178'),
    corte: obtenerColorVar('--aluminio-corte', '#f0f1f3'),
    vidrio: obtenerColorVar('--vidrio', 'rgba(78, 165, 217, 0.30)'),
    vidrioBorde: obtenerColorVar('--vidrio-borde', '#3f88b8'),
    vidrioBrillo: obtenerColorVar('--vidrio-brillo', 'rgba(255, 255, 255, 0.5)'),
    acrilico: obtenerColorVar('--acrilico', 'rgba(140, 205, 220, 0.35)'),
    acrilicoBorde: obtenerColorVar('--acrilico-borde', '#3f97a8'),
    herraje: obtenerColorVar('--herraje', '#aeb4bb'),
    herrajeClaro: obtenerColorVar('--herraje-claro', '#d9dde1'),
    herrajeOscuro: obtenerColorVar('--herraje-oscuro', '#565c64'),
    empaque: obtenerColorVar('--empaque', '#4f5257'),
  };
}
