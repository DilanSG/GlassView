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
 * Overrides por REF y por sistema. El motor de geometría ya los consulta:
 * aquí se registrarán las secciones reales (Jamba 5020, Jamba 744...) sin
 * tocar el resto del sistema.
 */
const PARAMETROS_POR_REF: Record<string, Partial<ParametrosPerfil>> = {};

const PARAMETROS_POR_SISTEMA: Record<string, Partial<ParametrosPerfil>> = {};

export function parametrosDe(identidad: IdentidadPieza): ParametrosPerfil {
  return {
    ...PARAMETROS_POR_DEFECTO,
    ...(PARAMETROS_POR_SISTEMA[identidad.sistema] ?? {}),
    ...(PARAMETROS_POR_REF[identidad.ref] ?? {}),
  };
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
    };
  }

  if (tipo === 'rodachina') {
    return { clase: 'rodachina', categoria: 'rodachina', sistema: '', ref: pieza.ref };
  }

  if (tipo === 'manija') {
    const clase: ClasePieza = /SEGURO/i.test(descripcion) ? 'seguro' : 'manija';
    return { clase, categoria: 'manija', sistema: '', ref: pieza.ref };
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
    };
  }

  const clase = clasePorDescripcion(descripcion) ?? (tipo === 'perfil' ? 'perfil' : 'accesorio');
  return {
    clase,
    categoria: tipo === 'perfil' ? 'otro' : tipo,
    sistema: '',
    ref: pieza.ref,
  };
}

/** Identidad de un perfil del catálogo (para secciones y selectores). */
export function identidadDePerfil(perfil: PerfilVentaneria): IdentidadPieza {
  return {
    clase: claseDeCategoria(perfil.categoria, perfil.descripcion),
    categoria: perfil.categoria,
    sistema: perfil.sistema,
    ref: perfil.ref,
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
  jamba: 1.35,
  cabezal: 1.5,
  sillar: 1.7,
  'canal-u': 1,
  riel: 1.05,
  horizontal: 1.4,
  enganche: 1.3,
  traslape: 1.6,
  tubo: 1,
  pisavidrio: 1.6,
  adaptador: 1.8,
  empaque: 3.4,
  felpa: 4.4,
  rodachina: 1,
  manija: 1,
  seguro: 1,
  accesorio: 1.2,
  perfil: 1.2,
};

export function dimensionesSeccionPrevia(identidad: IdentidadPieza): {
  anchoCara: number;
  peralte: number;
} {
  const peralte = PERALTE_PREVIA[identidad.clase] ?? 4.5;
  return { anchoCara: peralte * (PROPORCION_CARA[identidad.clase] ?? 1.2), peralte };
}

export function dimensionesSeccionDePieza(
  pieza: PiezaPlano,
  identidad: IdentidadPieza,
): { anchoCara: number; peralte: number } {
  const peralte =
    pieza.orientacion === 'horizontal'
      ? Math.max(pieza.altoCm, 0.4)
      : Math.max(pieza.anchoCm, 0.4);
  return {
    anchoCara: Math.max(peralte * (PROPORCION_CARA[identidad.clase] ?? 1.2), 0.8),
    peralte,
  };
}
