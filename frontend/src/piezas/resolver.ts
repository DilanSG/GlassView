import type { PerfilCategoria, PerfilVentaneria, PiezaPlano } from '../tipos';
import type { ClasePieza, IdentidadPieza, ParametrosPerfil } from './tipos';

/**
 * Parámetros transversales genéricos (proporciones físicas, no medidas
 * comerciales). `inglete: 0` significa "longitud automática" (peralte).
 */
export const PARAMETROS_POR_DEFECTO: ParametrosPerfil = {
  pared: 0.16,
  garganta: 1,
  boca: 0.36,
  inglete: 0,
  radio: 0.07,
};

/**
 * Overrides por sistema: proporciones reales de cada línea del catálogo
 * (según la nomenclatura y el uso del Excel de ventanería). Las puertas
 * pesadas 7038 llevan paredes y gargantas mayores que las correderas
 * livianas 5020/744 o que los tubulares de baño P.B.
 */
const PARAMETROS_POR_SISTEMA: Record<string, Partial<ParametrosPerfil>> = {
  '5020': { pared: 0.17, garganta: 1.05, boca: 0.38, radio: 0.08 },
  '744': { pared: 0.17, garganta: 1.05, boca: 0.38, radio: 0.08 },
  '8025': { pared: 0.19, garganta: 1.15, boca: 0.42, radio: 0.09 },
  '7038': { pared: 0.24, garganta: 1.5, boca: 0.55, radio: 0.12 },
  '3831': { pared: 0.16, garganta: 1, boca: 0.36, radio: 0.07 },
  'P.B.': { pared: 0.13, garganta: 0.8, boca: 0.3, radio: 0.16 },
  ACR: { pared: 0.12, garganta: 0.7, boca: 0.28, radio: 0.14 },
};

/**
 * Overrides por REF para los perfiles con geometría más característica:
 * el sillar lleva el asiento del vidrio más profundo, el traslape una boca
 * menor (solape) y la serie 7038 paredes de puerta.
 */
const PARAMETROS_POR_REF: Record<string, Partial<ParametrosPerfil>> = {
  'ALNA-144': { garganta: 1.1, boca: 0.4 },
  'ALNA-194': { garganta: 1.25, boca: 0.42 },
  'ALNB-193': { garganta: 1.05, boca: 0.38 },
  'ALNB-147': { garganta: 1, boca: 0.36 },
  'ALNA-192': { garganta: 0.95, boca: 0.34 },
  'ALNA-349': { garganta: 1, boca: 0.36 },
  'ALN-581': { pared: 0.2, garganta: 1.3, boca: 0.5 },
  'ALN-700': { pared: 0.26, garganta: 1.6, boca: 0.6, radio: 0.13 },
  'ALN-775': { pared: 0.27, garganta: 1.7, boca: 0.62, radio: 0.13 },
  'ALN-702': { pared: 0.25, garganta: 1.55, boca: 0.58, radio: 0.12 },
  'ALN-705': { pared: 0.24, garganta: 1.5, boca: 0.56, radio: 0.12 },
  'ALN-704': { pared: 0.23, garganta: 1.45, boca: 0.54, radio: 0.12 },
  'ALN-703': { pared: 0.24, garganta: 1.5, boca: 0.56, radio: 0.12 },
  'ALN-1101': { pared: 0.14, garganta: 0.85, boca: 0.32, radio: 0.2 },
  'ALN-1102': { pared: 0.14, garganta: 0.85, boca: 0.32, radio: 0.2 },
  'ALN-403': { pared: 0.14, garganta: 0.8, boca: 0.3, radio: 0.2 },
};

export function parametrosDe(identidad: IdentidadPieza): ParametrosPerfil {
  return {
    ...PARAMETROS_POR_DEFECTO,
    ...(PARAMETROS_POR_SISTEMA[identidad.sistema] ?? {}),
    ...(PARAMETROS_POR_REF[identidad.ref] ?? {}),
  };
}

/** Convierte una medida en pulgadas («1 1/2», «3/4», «2») a centímetros. */
function pulgadasACm(texto: string): number {
  const mixto = texto.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixto) {
    return (Number(mixto[1]) + Number(mixto[2]) / Number(mixto[3])) * 2.54;
  }
  const fraccion = texto.match(/^(\d+)\/(\d+)$/);
  if (fraccion) {
    return (Number(fraccion[1]) / Number(fraccion[2])) * 2.54;
  }
  const entero = texto.match(/^(\d+(?:[.,]\d+)?)$/);
  return entero ? Number(entero[1].replace(',', '.')) * 2.54 : 0;
}

const MEDIDA_PULGADAS = String.raw`\d+\/\d+|\d+(?:\s+\d+\/\d+)?`;

/**
 * Medidas reales de un tubo (ancho de cara × peralte, en cm) a partir de su
 * descripción comercial del Excel: «TUBO 2X1», «1 1/2 X 1 1/2», «3/4 liso»…
 */
export function medidasTuboDeTexto(
  texto: string,
): { anchoCara: number; peralte: number } | null {
  const limpio = texto.toUpperCase().replace(/[«»]/g, ' ').replace(/\s+/g, ' ').trim();
  const par = limpio.match(new RegExp(`(${MEDIDA_PULGADAS})\\s*X\\s*(${MEDIDA_PULGADAS})`));
  if (par) {
    const ladoA = pulgadasACm(par[1].trim());
    const ladoB = pulgadasACm(par[2].trim());
    if (ladoA > 0 && ladoB > 0 && ladoA < 25 && ladoB < 25) {
      return { anchoCara: Math.max(ladoA, ladoB), peralte: Math.min(ladoA, ladoB) };
    }
  }
  // Tubo cuadrado de una sola medida: «3/4 liso», «5/8 (1)»…
  const simple = limpio.match(new RegExp(`(${MEDIDA_PULGADAS})`));
  if (simple) {
    const lado = pulgadasACm(simple[1].trim());
    if (lado > 0.8 && lado < 12) {
      return { anchoCara: lado, peralte: lado };
    }
  }
  return null;
}

const PATRONES_DESCRIPCION: Array<[RegExp, ClasePieza]> = [
  [/PISA[\s-]*VIDRIO/i, 'pisavidrio'],
  [/FELPA/i, 'felpa'],
  [/EMPAQUE/i, 'empaque'],
  [/TRASLAPE/i, 'traslape'],
  [/ENGANCHE|PARAL|DIVISOR/i, 'enganche'],
  [/ADAPTADOR/i, 'adaptador'],
  [/BOTAGUA/i, 'sillar'],
  [/JAMBA/i, 'jamba'],
  [/CABEZAL/i, 'cabezal'],
  [/SILLAR/i, 'sillar'],
  [/HORIZONTAL|HOR\b/i, 'horizontal'],
  [/CANAL|\bU\b/i, 'canal-u'],
  [/RIEL|GUIA|GUÍA/i, 'riel'],
  [/TUBO/i, 'tubo'],
  [/ACRILICO|ACRÍLICO/i, 'acrilico'],
  [/VIDRIO/i, 'vidrio'],
  [/ANGULO|ÁNGULO|CHAPETA|BARRA|SOPORTE/i, 'accesorio'],
];

const CLASES_POR_CATEGORIA: Partial<Record<PerfilCategoria, ClasePieza>> = {
  vidrio: 'vidrio',
  cabezal: 'cabezal',
  sillar: 'sillar',
  jamba: 'jamba',
  horizontal: 'horizontal',
  riel: 'riel',
  'canal-u': 'canal-u',
  rodachina: 'rodachina',
  manija: 'manija',
  empaque: 'empaque',
  tubo: 'tubo',
  otro: 'accesorio',
};

export function clasePorDescripcion(texto: string): ClasePieza | null {
  const patron = PATRONES_DESCRIPCION.find(([expresion]) => expresion.test(texto));
  return patron ? patron[1] : null;
}

export function claseDeCategoria(
  categoria: PerfilCategoria | string,
  descripcion: string,
): ClasePieza {
  const porDescripcion = clasePorDescripcion(descripcion);
  if (categoria === 'hoja') {
    return porDescripcion ?? 'enganche';
  }
  if (categoria === 'manija') {
    return /SEGURO/i.test(descripcion) ? 'seguro' : 'manija';
  }
  if (categoria === 'tubo') {
    return porDescripcion ?? 'tubo';
  }
  if (categoria === 'empaque') {
    return porDescripcion ?? 'empaque';
  }
  if (categoria === 'otro') {
    return porDescripcion ?? 'accesorio';
  }
  return CLASES_POR_CATEGORIA[categoria as PerfilCategoria] ?? porDescripcion ?? 'perfil';
}

/** Resuelve la clase visual de una pieza combinando tipo, REF y descripción. */
export function resolverIdentidad(
  pieza: PiezaPlano,
  perfiles: PerfilVentaneria[],
): IdentidadPieza {
  const tipo = (pieza.tipo ?? '').toLowerCase();
  const descripcion = `${pieza.ref ?? ''} ${pieza.descripcion ?? ''}`;

  if (tipo === 'vidrio' || tipo === 'acrilico') {
    return {
      clase: tipo,
      categoria: 'vidrio',
      sistema: '',
      ref: pieza.ref,
      descripcion: pieza.descripcion,
    };
  }

  if (tipo === 'rodachina') {
    return {
      clase: 'rodachina',
      categoria: 'rodachina',
      sistema: '',
      ref: pieza.ref,
      descripcion: pieza.descripcion,
    };
  }

  if (tipo === 'manija') {
    const clase: ClasePieza = /SEGURO/i.test(descripcion) ? 'seguro' : 'manija';
    return {
      clase,
      categoria: 'manija',
      sistema: '',
      ref: pieza.ref,
      descripcion: pieza.descripcion,
    };
  }

  const perfil = perfiles.find(
    (candidato) => candidato.ref.toLowerCase() === (pieza.ref ?? '').toLowerCase(),
  );
  if (perfil) {
    return {
      clase: claseDeCategoria(perfil.categoria, `${perfil.descripcion} ${pieza.descripcion ?? ''}`),
      categoria: perfil.categoria,
      sistema: perfil.sistema,
      ref: perfil.ref,
      descripcion: perfil.descripcion,
    };
  }

  const clase = clasePorDescripcion(descripcion) ?? (tipo === 'perfil' ? 'perfil' : 'accesorio');
  return {
    clase,
    categoria: tipo === 'perfil' ? 'otro' : tipo,
    sistema: '',
    ref: pieza.ref,
    descripcion: pieza.descripcion,
  };
}

/** Identidad de un perfil del catálogo (para secciones y selectores). */
export function identidadDePerfil(perfil: PerfilVentaneria): IdentidadPieza {
  return {
    clase: claseDeCategoria(perfil.categoria, perfil.descripcion),
    categoria: perfil.categoria,
    sistema: perfil.sistema,
    ref: perfil.ref,
    descripcion: perfil.descripcion,
  };
}

export const ETIQUETA_CLASE: Record<ClasePieza, string> = {
  vidrio: 'Vidrio',
  acrilico: 'Acrílico',
  jamba: 'Jamba',
  cabezal: 'Cabezal',
  sillar: 'Sillar',
  'canal-u': 'Canal U',
  riel: 'Riel',
  horizontal: 'Horizontal',
  enganche: 'Enganche',
  traslape: 'Traslape',
  tubo: 'Tubo',
  pisavidrio: 'Pisavidrio',
  adaptador: 'Adaptador',
  empaque: 'Empaque',
  felpa: 'Felpa',
  rodachina: 'Rodachina',
  manija: 'Manija',
  seguro: 'Seguro',
  accesorio: 'Accesorio',
  perfil: 'Perfil',
};

/** Peralte aproximado para previsualizar la sección de un perfil sin pieza. */
const PERALTE_PREVIA: Record<ClasePieza, number> = {
  vidrio: 0.4,
  acrilico: 0.4,
  jamba: 4.6,
  cabezal: 4.6,
  sillar: 5,
  'canal-u': 2.6,
  riel: 3.2,
  horizontal: 4.2,
  enganche: 4.4,
  traslape: 4.4,
  tubo: 3.8,
  pisavidrio: 1.4,
  adaptador: 3.6,
  empaque: 0.7,
  felpa: 0.5,
  rodachina: 3,
  manija: 3,
  seguro: 3,
  accesorio: 3,
  perfil: 4,
};

/** Relación ancho de cara / peralte con la que se dibuja la sección. */
const PROPORCION_CARA: Record<ClasePieza, number> = {
  vidrio: 24,
  acrilico: 24,
  jamba: 0.95,
  cabezal: 1.05,
  sillar: 1.15,
  'canal-u': 1,
  riel: 1.05,
  horizontal: 1,
  enganche: 0.95,
  traslape: 1.05,
  tubo: 1,
  pisavidrio: 1.6,
  adaptador: 1.1,
  empaque: 3.4,
  felpa: 4.4,
  rodachina: 1,
  manija: 1,
  seguro: 1,
  accesorio: 1.2,
  perfil: 1.2,
};

/** Medidas comerciales de tubos y canales U a partir de su descripción. */
function medidasComerciales(
  identidad: IdentidadPieza,
): { anchoCara: number; peralte: number } | null {
  if (identidad.clase !== 'tubo' && identidad.clase !== 'canal-u') {
    return null;
  }
  return medidasTuboDeTexto(`${identidad.ref} ${identidad.descripcion ?? ''}`);
}

export function dimensionesSeccionPrevia(identidad: IdentidadPieza): {
  anchoCara: number;
  peralte: number;
} {
  // Los tubos y canales llevan su medida real en la descripción del Excel.
  const medidas = medidasComerciales(identidad);
  if (medidas) {
    return medidas;
  }
  const peralte = PERALTE_PREVIA[identidad.clase] ?? 4.5;
  return { anchoCara: peralte * (PROPORCION_CARA[identidad.clase] ?? 1.2), peralte };
}

export function dimensionesSeccionDePieza(
  pieza: PiezaPlano,
  identidad: IdentidadPieza,
): { anchoCara: number; peralte: number } {
  // En tubos y canales manda la medida comercial de la REF.
  const medidas = medidasComerciales(identidad);
  if (medidas) {
    return medidas;
  }
  const peralte =
    pieza.orientacion === 'horizontal'
      ? Math.max(pieza.altoCm, 0.4)
      : Math.max(pieza.anchoCm, 0.4);
  return {
    anchoCara: Math.max(peralte * (PROPORCION_CARA[identidad.clase] ?? 1.2), 0.8),
    peralte,
  };
}
