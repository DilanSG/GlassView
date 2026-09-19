import {
  GROSOR_FINO,
  GROSOR_MEDIO,
  arco,
  circulo,
  linea,
  lineaPerfil,
  mapeoPerfil,
  poligono,
  poligonoPerfil,
  rect,
  rectPerfil,
} from './primitivas';
import type {
  ClasePieza,
  ContextoElevacion,
  ContextoSeccion,
  DefinicionPieza,
  IdentidadPieza,
  Primitiva,
  Punto,
} from './tipos';

const PARED_MINIMA = 0.08;

interface OpcionesElevacion {
  canal?: 'cerrado' | 'abierto' | 'ninguno';
  inglete?: boolean;
  garganta?: boolean;
  gotero?: boolean;
  peldano?: boolean;
  labios?: boolean;
  gancho?: boolean;
  solape?: boolean;
  triangulo?: boolean;
  redondeado?: boolean;
}

interface OpcionesSeccion {
  garganta?: boolean;
  canal?: 'cerrado' | 'abierto' | 'ninguno';
  labios?: boolean;
  redondeado?: boolean;
  triangulo?: boolean;
}

/**
 * Motor de elevación de perfiles de aluminio: dibuja la pieza a lo largo de
 * su eje con la cámara hueca, la garganta de vidrio orientada al interior,
 * ingletes en los extremos y los rasgos propios de cada tipo (gotero,
 * peldaño, labios, gancho, solape...). Todas las coordenadas van en cm.
 */
function elevacionPerfil(ctx: ContextoElevacion, opciones: OpcionesElevacion): Primitiva[] {
  const { largo, peralte, params, orientacion } = ctx;

  if (largo < 1.4 || peralte < 0.8) {
    return [
      rect(0, 0, ctx.pieza.anchoCm, ctx.pieza.altoCm, {
        relleno: 'perfil',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
        radio: 0.04,
      }),
    ];
  }

  const mapeo = mapeoPerfil(orientacion);
  const primitivas: Primitiva[] = [];
  const pared = Math.max(PARED_MINIMA, Math.min(params.pared, peralte / 4));
  const radio = Math.min(opciones.redondeado ? peralte * 0.3 : params.radio, peralte / 3, largo / 3);
  const acInterior = ctx.interior === 1 ? peralte : 0;
  const acExterior = ctx.interior === 1 ? 0 : peralte;
  const haciaDentro = ctx.interior === 1 ? -1 : 1;

  // Contorno exterior del perfil
  primitivas.push(
    rectPerfil(mapeo, 0, 0, largo, peralte, {
      relleno: 'perfil',
      tono: 'perfilBorde',
      grosor: GROSOR_MEDIO,
      radio,
    }),
  );

  const inglete = Math.min(params.inglete > 0 ? params.inglete : peralte, largo / 3);
  const margenExtremo = opciones.inglete ? inglete : 0.05;

  // Cámara hueca del perfil (o canal abierto hacia el interior)
  if (opciones.canal && opciones.canal !== 'ninguno') {
    const cavidadLargo = Math.max(0.1, largo - margenExtremo * 2);
    const anchoInicial = opciones.canal === 'abierto' && ctx.interior === -1 ? 0 : pared;
    const anchoFinal = opciones.canal === 'abierto' && ctx.interior === 1 ? peralte : peralte - pared;
    primitivas.push(
      rectPerfil(mapeo, margenExtremo, anchoInicial, cavidadLargo, anchoFinal - anchoInicial, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        radio: Math.max(0, radio - pared),
      }),
    );
  }

  // Garganta de vidrio sobre el lado interior
  if (opciones.garganta) {
    const garganta = Math.min(params.garganta, peralte / 3);
    const boca = Math.min(params.boca, garganta);
    primitivas.push(
      rectPerfil(mapeo, 0, Math.min(acInterior, acInterior + haciaDentro * garganta), largo, garganta, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      lineaPerfil(mapeo, 0, acInterior + haciaDentro * garganta, largo, acInterior + haciaDentro * garganta, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    const paso = Math.max(5, largo / 10);
    for (let posicion = paso * 0.6; posicion < largo - 0.2; posicion += paso) {
      primitivas.push(
        lineaPerfil(mapeo, posicion, acInterior, posicion, acInterior + haciaDentro * Math.max(boca, 0.24), {
          tono: 'empaque',
          grosor: Math.max(0.12, boca * 0.5),
        }),
      );
    }
  }

  // Gotero exterior del cabezal
  if (opciones.gotero) {
    const acGotero = acExterior + (ctx.interior === 1 ? 1 : -1) * Math.min(peralte * 0.3, 0.9);
    primitivas.push(
      lineaPerfil(mapeo, 0.2, acGotero, largo - 0.2, acGotero, {
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
  }

  // Peldaño del sillar
  if (opciones.peldano) {
    const acPeldano = acInterior + haciaDentro * Math.min(peralte * 0.45, 1.2);
    primitivas.push(
      lineaPerfil(mapeo, 0.15, acPeldano, largo - 0.15, acPeldano, {
        tono: 'perfilBorde',
        grosor: GROSOR_MEDIO,
      }),
    );
  }

  // Labios del riel (guían la hoja)
  if (opciones.labios) {
    const labio = Math.min(peralte * 0.2, 0.45);
    primitivas.push(
      rectPerfil(mapeo, 0.1, acInterior, largo - 0.2, haciaDentro * labio, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
  }

  // Gancho del enganche
  if (opciones.gancho) {
    const garfio = Math.min(peralte * 0.4, 1.4);
    primitivas.push(
      poligonoPerfil(
        mapeo,
        [
          [0.1, acInterior],
          [largo - 0.1, acInterior],
          [largo - 0.1, acInterior + haciaDentro * garfio],
          [largo * 0.78, acInterior + haciaDentro * garfio * 0.55],
          [largo * 0.78, acInterior + haciaDentro * 0.16],
          [0.1, acInterior + haciaDentro * 0.16],
        ],
        { relleno: 'perfilClaro', tono: 'perfilBorde', grosor: GROSOR_FINO },
      ),
    );
  }

  // Solape ancho del traslape
  if (opciones.solape) {
    const solape = Math.min(peralte * 0.35, 1.1);
    primitivas.push(
      rectPerfil(mapeo, 0.1, acInterior, largo - 0.2, haciaDentro * solape, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      lineaPerfil(
        mapeo,
        0.6,
        acInterior + haciaDentro * solape * 0.5,
        largo - 0.6,
        acInterior + haciaDentro * solape * 0.5,
        { tono: 'perfilDetalle', grosor: GROSOR_FINO },
      ),
    );
  }

  // Pisavidrio: cuña que sujeta el vidrio
  if (opciones.triangulo) {
    primitivas.push(
      poligonoPerfil(
        mapeo,
        [
          [0, acExterior],
          [largo, acExterior],
          [largo, acExterior + (ctx.interior === 1 ? peralte : -peralte) * 0.55],
        ],
        { relleno: 'perfilClaro', tono: 'perfilBorde', grosor: GROSOR_FINO },
      ),
    );
  }

  // Ingletes de marco en los extremos
  if (opciones.inglete) {
    primitivas.push(
      lineaPerfil(mapeo, 0, acExterior, inglete, acInterior, {
        tono: 'perfilBorde',
        grosor: GROSOR_MEDIO,
      }),
    );
    primitivas.push(
      poligonoPerfil(mapeo, [[0, acExterior], [inglete, acInterior], [0, acInterior]], {
        relleno: 'corte',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      lineaPerfil(mapeo, largo, acExterior, largo - inglete, acInterior, {
        tono: 'perfilBorde',
        grosor: GROSOR_MEDIO,
      }),
    );
    primitivas.push(
      poligonoPerfil(mapeo, [[largo, acExterior], [largo - inglete, acInterior], [largo, acInterior]], {
        relleno: 'corte',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
  }

  return primitivas;
}

/** Sección transversal genérica de un perfil tubular de aluminio. */
function seccionPerfil(ctx: ContextoSeccion, opciones: OpcionesSeccion): Primitiva[] {
  const { anchoCara, peralte, params } = ctx;
  const primitivas: Primitiva[] = [];
  const pared = Math.max(PARED_MINIMA, Math.min(params.pared, peralte / 4, anchoCara / 4));
  const radio = Math.min(opciones.redondeado ? peralte * 0.3 : params.radio, anchoCara / 3, peralte / 3);

  primitivas.push(
    rect(0, 0, anchoCara, peralte, {
      relleno: 'perfil',
      tono: 'perfilBorde',
      grosor: GROSOR_MEDIO,
      radio,
    }),
  );

  if (opciones.triangulo) {
    primitivas.push(
      poligono(
        [
          { x: 0, y: 0 },
          { x: anchoCara, y: peralte * 0.1 },
          { x: anchoCara, y: peralte },
          { x: 0, y: peralte },
        ],
        { relleno: 'perfilClaro', tono: 'perfilBorde', grosor: GROSOR_FINO },
      ),
    );
    return primitivas;
  }

  if (opciones.canal && opciones.canal !== 'ninguno') {
    const abierto = opciones.canal === 'abierto';
    const xCavidad = pared;
    const anchoCavidad = Math.max(0.1, anchoCara - pared * 2);
    const altoCavidad = Math.max(0.1, abierto ? peralte - pared : peralte - pared * 2);
    const yCavidad = abierto && ctx.interior === 1 ? pared : 0;
    primitivas.push(
      rect(xCavidad, yCavidad, anchoCavidad, altoCavidad, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        radio: Math.max(0, radio - pared),
      }),
    );
  }

  if (opciones.garganta) {
    const base = ctx.interior === 1 ? peralte : 0;
    const haciaDentro = ctx.interior === 1 ? -1 : 1;
    const garganta = Math.min(params.garganta, peralte / 2.6);
    const boca = Math.min(params.boca, anchoCara / 2.6);
    primitivas.push(
      rect((anchoCara - boca) / 2, Math.min(base, base + haciaDentro * garganta), boca, garganta, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      linea((anchoCara - boca) / 2, base, (anchoCara - boca) / 2, base + haciaDentro * garganta, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      linea((anchoCara + boca) / 2, base, (anchoCara + boca) / 2, base + haciaDentro * garganta, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      rect((anchoCara - boca) / 2, base + haciaDentro * garganta * 0.5, boca, Math.max(0.1, garganta * 0.35), {
        relleno: 'empaque',
        grosor: 0,
      }),
    );
  }

  if (opciones.labios) {
    const base = ctx.interior === 1 ? peralte : 0;
    const haciaDentro = ctx.interior === 1 ? -1 : 1;
    const labio = Math.max(0.14, peralte * 0.18);
    primitivas.push(
      rect(0, Math.min(base, base + haciaDentro * labio), pared * 1.4, labio, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      rect(anchoCara - pared * 1.4, Math.min(base, base + haciaDentro * labio), pared * 1.4, labio, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
  }

  return primitivas;
}

/** Elevación de una lámina de vidrio o acrílico con sus reflejos. */
function elevacionLamina(
  ctx: ContextoElevacion,
  material: 'vidrio' | 'acrilico',
): Primitiva[] {
  const ancho = ctx.pieza.anchoCm;
  const alto = ctx.pieza.altoCm;
  const tonoRelleno = material === 'vidrio' ? 'vidrio' : 'acrilico';
  const tonoBorde = material === 'vidrio' ? 'vidrioBorde' : 'acrilicoBorde';
  const radio = Math.min(0.18, ancho / 8, alto / 8);

  const primitivas: Primitiva[] = [
    rect(0, 0, ancho, alto, {
      relleno: tonoRelleno,
      tono: tonoBorde,
      grosor: GROSOR_MEDIO,
      radio,
    }),
  ];

  const anchoBanda = Math.min(ancho * 0.16, 6);
  const desliz = Math.min(alto * 0.55, ancho * 0.9);
  for (const inicio of [ancho * 0.18, ancho * 0.44]) {
    primitivas.push(
      poligono(
        [
          { x: inicio, y: 0 },
          { x: inicio + anchoBanda, y: 0 },
          { x: inicio + anchoBanda - desliz, y: alto },
          { x: inicio - desliz, y: alto },
        ],
        { relleno: 'vidrioBrillo', opacidad: material === 'vidrio' ? 0.55 : 0.4 },
      ),
    );
  }

  primitivas.push(
    rect(0.3, 0.3, Math.max(0.1, ancho - 0.6), Math.max(0.1, alto - 0.6), {
      tono: tonoBorde,
      grosor: GROSOR_FINO,
      radio: Math.max(0, radio - 0.2),
      opacidad: 0.55,
    }),
  );

  return primitivas;
}

/** Empaque o felpa: junta continua sobre el borde del vidrio. */
function elevacionJunta(ctx: ContextoElevacion, tipo: 'empaque' | 'felpa'): Primitiva[] {
  const { largo, peralte, orientacion } = ctx;
  if (largo < 1.2 || peralte < 0.25) {
    return [
      rect(0, 0, ctx.pieza.anchoCm, ctx.pieza.altoCm, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    ];
  }

  const mapeo = mapeoPerfil(orientacion);
  const base = ctx.interior === 1 ? peralte : 0;
  const haciaDentro = ctx.interior === 1 ? -1 : 1;
  const primitivas: Primitiva[] = [
    rectPerfil(mapeo, 0, 0, largo, peralte, {
      relleno: 'perfilOscuro',
      tono: 'perfilDetalle',
      grosor: GROSOR_FINO,
      radio: Math.min(peralte / 2, 0.12),
    }),
  ];

  if (tipo === 'empaque') {
    const paso = Math.max(0.7, largo / 36);
    const puntos: Punto[] = [];
    let alterno = false;
    for (let posicion = 0; posicion <= largo; posicion += paso) {
      puntos.push(mapeo(posicion, base + haciaDentro * (alterno ? peralte * 0.35 : peralte * 0.85)));
      alterno = !alterno;
    }
    primitivas.push(poligono(puntos, { tono: 'empaque', grosor: GROSOR_FINO }));
  } else {
    const paso = Math.max(0.5, largo / 60);
    for (let posicion = 0; posicion <= largo; posicion += paso) {
      primitivas.push(
        lineaPerfil(mapeo, posicion, base, posicion + 0.08, base + haciaDentro * peralte * 0.95, {
          tono: 'empaque',
          grosor: GROSOR_FINO,
        }),
      );
    }
  }

  return primitivas;
}

/** Rodachina: soporte con tornillos y rueda con eje. */
function elevacionRodachina(ctx: ContextoElevacion): Primitiva[] {
  const ancho = ctx.pieza.anchoCm;
  const alto = ctx.pieza.altoCm;
  const centroX = ancho / 2;
  const radio = Math.min(ancho, alto) * 0.3;
  const centroY = alto * 0.64;

  return [
    rect(ancho * 0.16, alto * 0.08, ancho * 0.68, alto * 0.3, {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
      radio: 0.08,
    }),
    circulo(ancho * 0.3, alto * 0.23, ancho * 0.045, { relleno: 'herrajeOscuro' }),
    circulo(ancho * 0.7, alto * 0.23, ancho * 0.045, { relleno: 'herrajeOscuro' }),
    circulo(centroX, centroY, radio, {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
    }),
    circulo(centroX, centroY, radio * 0.48, {
      relleno: 'herrajeClaro',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
    }),
    circulo(centroX, centroY, Math.max(0.05, radio * 0.16), { relleno: 'herrajeOscuro' }),
  ];
}

/** Manija: placa de anclaje y palanca. */
function elevacionManija(ctx: ContextoElevacion): Primitiva[] {
  const ancho = ctx.pieza.anchoCm;
  const alto = ctx.pieza.altoCm;

  return [
    rect(ancho * 0.32, alto * 0.14, ancho * 0.36, alto * 0.34, {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
      radio: 0.07,
    }),
    circulo(ancho * 0.5, alto * 0.31, Math.min(ancho, alto) * 0.08, { relleno: 'herrajeOscuro' }),
    rect(ancho * 0.14, alto * 0.55, ancho * 0.72, Math.max(0.24, alto * 0.16), {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
      radio: Math.max(0.08, alto * 0.07),
    }),
  ];
}

/** Seguro: placa con pestillo de gancho. */
function elevacionSeguro(ctx: ContextoElevacion): Primitiva[] {
  const ancho = ctx.pieza.anchoCm;
  const alto = ctx.pieza.altoCm;

  return [
    rect(ancho * 0.28, alto * 0.16, ancho * 0.44, alto * 0.68, {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
      radio: 0.07,
    }),
    poligono(
      [
        { x: ancho * 0.5, y: alto * 0.3 },
        { x: ancho * 0.86, y: alto * 0.3 },
        { x: ancho * 0.86, y: alto * 0.44 },
        { x: ancho * 0.62, y: alto * 0.44 },
      ],
      { tono: 'herrajeOscuro', grosor: GROSOR_FINO },
    ),
    circulo(ancho * 0.5, alto * 0.7, ancho * 0.06, { relleno: 'herrajeOscuro' }),
  ];
}

function seccionLamina(material: 'vidrio' | 'acrilico') {
  return (ctx: ContextoSeccion): Primitiva[] => {
    const { anchoCara, peralte } = ctx;
    const tonoRelleno = material === 'vidrio' ? 'vidrio' : 'acrilico';
    const tonoBorde = material === 'vidrio' ? 'vidrioBorde' : 'acrilicoBorde';
    const espesor = Math.max(0.15, Math.min(peralte, 0.6));
    const y = (peralte - espesor) / 2;
    return [
      rect(0, y, anchoCara, espesor, {
        relleno: tonoRelleno,
        tono: tonoBorde,
        grosor: GROSOR_FINO,
        radio: 0.03,
      }),
      rect(0.25, y + espesor * 0.28, anchoCara * 0.4, espesor * 0.24, {
        relleno: 'vidrioBrillo',
        opacidad: 0.7,
      }),
    ];
  };
}

function seccionEmpaque(tipo: 'empaque' | 'felpa') {
  return (ctx: ContextoSeccion): Primitiva[] => {
    const { anchoCara, peralte } = ctx;
    const base = peralte * 0.45;
    const primitivas: Primitiva[] = [
      rect(0, base, anchoCara, peralte - base, { relleno: 'empaque', grosor: 0 }),
    ];
    if (tipo === 'empaque') {
      primitivas.push(
        arco(anchoCara / 2, base, Math.min(anchoCara * 0.3, base), Math.PI, 0, {
          tono: 'empaque',
          grosor: GROSOR_MEDIO,
        }),
      );
    } else {
      for (let x = 0.1; x < anchoCara; x += Math.max(0.25, anchoCara / 10)) {
        primitivas.push(linea(x, base, x, 0, { tono: 'empaque', grosor: GROSOR_FINO }));
      }
    }
    return primitivas;
  };
}

const definicionVidrio: DefinicionPieza = {
  etiqueta: 'Vidrio',
  elevacion: (ctx) => elevacionLamina(ctx, 'vidrio'),
  seccion: seccionLamina('vidrio'),
};

const definicionAcrilico: DefinicionPieza = {
  etiqueta: 'Acrílico',
  elevacion: (ctx) => elevacionLamina(ctx, 'acrilico'),
  seccion: seccionLamina('acrilico'),
};

/**
 * Definiciones por clase visual. Cada una describe su elevación y su sección
 * transversal; las variantes comerciales por sistema se registran en
 * `DEFINICIONES_POR_SISTEMA` sin tocar estas definiciones base.
 */
export const DEFINICIONES: Record<ClasePieza, DefinicionPieza> = {
  vidrio: definicionVidrio,
  acrilico: definicionAcrilico,
  jamba: {
    etiqueta: 'Jamba',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, { canal: 'cerrado', inglete: true, garganta: true }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  cabezal: {
    etiqueta: 'Cabezal',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, { canal: 'cerrado', inglete: true, garganta: true, gotero: true }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  sillar: {
    etiqueta: 'Sillar',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, { canal: 'cerrado', inglete: true, garganta: true, peldano: true }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  'canal-u': {
    etiqueta: 'Canal U',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'abierto' }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'abierto' }),
  },
  riel: {
    etiqueta: 'Riel',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', labios: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado', labios: true }),
  },
  horizontal: {
    etiqueta: 'Horizontal',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', garganta: true }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  enganche: {
    etiqueta: 'Enganche',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', gancho: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
  traslape: {
    etiqueta: 'Traslape',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', solape: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
  tubo: {
    etiqueta: 'Tubo',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', redondeado: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado', redondeado: true }),
  },
  pisavidrio: {
    etiqueta: 'Pisavidrio',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'ninguno', triangulo: true }),
    seccion: (ctx) => seccionPerfil(ctx, { triangulo: true }),
  },
  adaptador: {
    etiqueta: 'Adaptador',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', peldano: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
  empaque: {
    etiqueta: 'Empaque',
    elevacion: (ctx) => elevacionJunta(ctx, 'empaque'),
    seccion: seccionEmpaque('empaque'),
  },
  felpa: {
    etiqueta: 'Felpa',
    elevacion: (ctx) => elevacionJunta(ctx, 'felpa'),
    seccion: seccionEmpaque('felpa'),
  },
  rodachina: { etiqueta: 'Rodachina', elevacion: elevacionRodachina },
  manija: { etiqueta: 'Manija', elevacion: elevacionManija },
  seguro: { etiqueta: 'Seguro', elevacion: elevacionSeguro },
  accesorio: {
    etiqueta: 'Accesorio',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado' }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
  perfil: {
    etiqueta: 'Perfil',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado' }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
};

/**
 * Overrides por sistema (p. ej. `5020` → `jamba` con otra sección). Vacío por
 * ahora: aquí se registrarán las geometrías comerciales cuando existan datos.
 */
const DEFINICIONES_POR_SISTEMA: Partial<
  Record<string, Partial<Record<ClasePieza, DefinicionPieza>>>
> = {};

export function definicionDe(identidad: IdentidadPieza): DefinicionPieza {
  return (
    DEFINICIONES_POR_SISTEMA[identidad.sistema]?.[identidad.clase] ??
    DEFINICIONES[identidad.clase]
  );
}
