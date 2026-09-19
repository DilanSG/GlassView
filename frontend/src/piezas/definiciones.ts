import {
  GROSOR_FINO,
  GROSOR_MEDIO,
  arco,
  circulo,
  lineaPerfil,
  mapeoPerfil,
  poligonoPerfil,
  rectPerfil,
  rect,
  circulo as circuloLocal,
  poligono,
  linea,
} from './primitivas';
import type {
  ClasePieza,
  ContextoElevacion,
  ContextoSeccion,
  DefinicionPieza,
  IdentidadPieza,
  Primitiva,
} from './tipos';

interface OpcionesElevacion {
  canal?: 'cerrado' | 'abierto' | 'ninguno';
  inglete?: boolean;
  garganta?: boolean;
  /** Ranura de vidrio centrada (perfiles horizontales de hoja). */
  gargantaCentro?: boolean;
  /** Puertos de tornillo cerca de los extremos (marco atornillado). */
  tornillos?: boolean;
  gotero?: boolean;
  peldano?: boolean;
  labios?: boolean;
  gancho?: boolean;
  recibidor?: boolean;
  riel?: boolean;
  triangulo?: boolean;
  redondeado?: boolean;
}

interface OpcionesSeccion {
  garganta?: boolean;
  gargantaCentro?: boolean;
  canal?: 'cerrado' | 'abierto' | 'ninguno';
  labios?: boolean;
  redondeado?: boolean;
  triangulo?: boolean;
}

/**
 * Motor de elevación de perfiles de aluminio: dibuja el perfil a lo largo de
 * su eje con el cuerpo, la cámara hueca, la garganta de vidrio orientada al
 * interior, ingletes en los extremos y los rasgos de cada tipo (gotero,
 * peldaño, labios, gancho, solape, riel...). Todas las coordenadas van en cm.
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
  // Pared visible: proporcional al perfil para que la cámara hueca se lea bien
  // incluso en perfiles pequeños (algo más gruesa que la real).
  const pared = Math.min(
    Math.max(params.pared, Math.min(peralte, largo) * 0.09),
    peralte / 3.2,
  );
  const radio = Math.min(opciones.redondeado ? peralte * 0.3 : params.radio, peralte / 3, largo / 3);
  const acInterior = ctx.interior === 1 ? peralte : 0;
  const acExterior = ctx.interior === 1 ? 0 : peralte;
  const haciaDentro = ctx.interior === 1 ? -1 : 1;

  primitivas.push(
    rectPerfil(mapeo, 0, 0, largo, peralte, {
      relleno: 'perfil',
      tono: 'perfilBorde',
      grosor: GROSOR_MEDIO,
      radio,
    }),
  );

  // Brillo longitudinal junto a la cara exterior: da volumen al aluminio.
  primitivas.push(
    lineaPerfil(mapeo, 0.15, acExterior + haciaDentro * pared * 0.5, largo - 0.15, acExterior + haciaDentro * pared * 0.5, {
      tono: 'perfilClaro',
      grosor: GROSOR_FINO,
      opacidad: 0.9,
    }),
  );

  const inglete = Math.min(params.inglete > 0 ? params.inglete : peralte, largo / 3);
  const margenExtremo = opciones.inglete ? inglete : 0.06;

  if (opciones.canal && opciones.canal !== 'ninguno') {
    const anchoInicial = opciones.canal === 'abierto' && ctx.interior === -1 ? 0 : pared;
    const anchoFinal = opciones.canal === 'abierto' && ctx.interior === 1 ? peralte : peralte - pared;
    primitivas.push(
      rectPerfil(mapeo, margenExtremo, anchoInicial, largo - margenExtremo * 2, anchoFinal - anchoInicial, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        radio: Math.max(0, radio - pared),
      }),
    );
    // Pared interior del tubo (segundo contorno)
    if (opciones.canal === 'cerrado' && peralte > 1.6) {
      primitivas.push(
        rectPerfil(
          mapeo,
          margenExtremo + pared * 0.5,
          anchoInicial + pared * 0.5,
          largo - margenExtremo * 2 - pared,
          anchoFinal - anchoInicial - pared,
          { tono: 'perfilClaro', grosor: GROSOR_FINO, opacidad: 0.55 },
        ),
      );
    }
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

  // Garganta centrada (perfiles horizontales de hoja): el vidrio entra por el centro
  if (opciones.gargantaCentro) {
    const boca = Math.min(params.boca, peralte / 3);
    const garganta = Math.min(params.garganta, peralte / 2.4);
    const centro = peralte / 2;
    primitivas.push(
      rectPerfil(mapeo, 0, centro - garganta / 2, largo, garganta, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      rectPerfil(mapeo, 0, centro - boca / 2, largo, boca, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        opacidad: 0.6,
      }),
    );
    const paso = Math.max(5, largo / 10);
    for (let posicion = paso * 0.6; posicion < largo - 0.2; posicion += paso) {
      primitivas.push(
        lineaPerfil(mapeo, posicion, centro - boca / 2, posicion, centro + boca / 2, {
          tono: 'empaque',
          grosor: 0.12,
        }),
      );
    }
  }

  // Gotero exterior del cabezal (labio de escurrimiento)
  if (opciones.gotero) {
    const acGotero = acExterior + (ctx.interior === 1 ? 1 : -1) * Math.min(peralte * 0.32, 1);
    primitivas.push(
      lineaPerfil(mapeo, 0.2, acGotero, largo - 0.2, acGotero, {
        tono: 'perfilBorde',
        grosor: GROSOR_MEDIO,
      }),
    );
    primitivas.push(
      lineaPerfil(mapeo, 0.2, acGotero + haciaDentro * 0.22, largo - 0.2, acGotero + haciaDentro * 0.22, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
      }),
    );
  }

  // Peldaño del sillar (asiento del vidrio y desagüe)
  if (opciones.peldano) {
    const acPeldano = acInterior + haciaDentro * Math.min(peralte * 0.45, 1.2);
    primitivas.push(
      lineaPerfil(mapeo, 0.15, acPeldano, largo - 0.15, acPeldano, {
        tono: 'perfilBorde',
        grosor: GROSOR_MEDIO,
      }),
    );
    const paso = Math.max(6, largo / 8);
    for (let posicion = paso * 0.5; posicion < largo; posicion += paso) {
      primitivas.push(
        lineaPerfil(mapeo, posicion, acExterior, posicion + haciaDentro * 0.5, acExterior + haciaDentro * 0.35, {
          tono: 'perfilDetalle',
          grosor: GROSOR_FINO,
          opacidad: 0.7,
        }),
      );
    }
  }

  // Labios del riel o del canal U (guían la hoja)
  if (opciones.labios) {
    const labio = Math.min(peralte * 0.22, 0.5);
    primitivas.push(
      rectPerfil(mapeo, 0.1, acInterior, largo - 0.2, haciaDentro * labio, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
  }

  // Guía del riel: ranura central por donde corre la rodachina
  if (opciones.riel) {
    const centro = peralte / 2;
    primitivas.push(
      rectPerfil(mapeo, 0.15, centro - 0.28, largo - 0.3, 0.56, {
        relleno: 'perfilOscuro',
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        radio: 0.1,
      }),
    );
  }

  // Gancho del enganche, con punta redondeada
  if (opciones.gancho) {
    const alto = Math.min(peralte * 0.55, 2.2);
    const punta = Math.min(peralte * 0.22, 0.8);
    primitivas.push(
      poligonoPerfil(
        mapeo,
        [
          [0.1, acInterior],
          [largo - 0.1, acInterior],
          [largo - 0.1, acInterior + haciaDentro * alto],
          [largo * 0.7, acInterior + haciaDentro * alto],
          [largo * 0.7, acInterior + haciaDentro * punta],
          [0.1, acInterior + haciaDentro * punta],
        ],
        { relleno: 'perfilClaro', tono: 'perfilBorde', grosor: GROSOR_FINO },
      ),
    );
    const centroGancho = mapeo(largo * 0.7, acInterior + haciaDentro * ((alto + punta) / 2));
    primitivas.push(
      circulo(centroGancho.x, centroGancho.y, Math.max(0.08, (alto - punta) / 2), {
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
  }

  // Recibidor del traslape: labio ancho con ranura de empaque
  if (opciones.recibidor) {
    const solape = Math.min(peralte * 0.45, 1.5);
    primitivas.push(
      rectPerfil(mapeo, 0.1, acInterior, largo - 0.2, haciaDentro * solape, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
        radio: 0.08,
      }),
    );
    primitivas.push(
      lineaPerfil(
        mapeo,
        0.5,
        acInterior + haciaDentro * solape * 0.45,
        largo - 0.5,
        acInterior + haciaDentro * solape * 0.45,
        { tono: 'perfilDetalle', grosor: GROSOR_FINO },
      ),
    );
    primitivas.push(
      lineaPerfil(mapeo, 0.5, acInterior + haciaDentro * 0.45, largo - 0.5, acInterior + haciaDentro * 0.45, {
        tono: 'empaque',
        grosor: 0.14,
      }),
    );
  }

  // Pisavidrio: cuña curvada que sujeta el vidrio
  if (opciones.triangulo) {
    const altoCuna = ctx.interior === 1 ? peralte : -peralte;
    const puntos: Array<[number, number]> = [[0, acExterior]];
    const pasos = 6;
    for (let indice = 1; indice <= pasos; indice += 1) {
      const avance = indice / pasos;
      puntos.push([
        largo * avance,
        acExterior + altoCuna * (0.28 + 0.27 * avance),
      ]);
    }
    puntos.push([largo, acExterior + altoCuna * 0.55]);
    primitivas.push(
      poligonoPerfil(mapeo, puntos, {
        relleno: 'perfilClaro',
        tono: 'perfilBorde',
        grosor: GROSOR_FINO,
      }),
    );
    primitivas.push(
      lineaPerfil(mapeo, 0.2, acExterior + altoCuna * 0.12, largo - 0.2, acExterior + altoCuna * 0.12, {
        tono: 'perfilDetalle',
        grosor: GROSOR_FINO,
        opacidad: 0.6,
      }),
    );
  }

  // Puertos de tornillo cerca de los extremos (marco atornillado)
  if (opciones.tornillos) {
    const anchoCavidadInicial = pared;
    const anchoCavidadFinal = peralte - pared;
    const centro = (anchoCavidadInicial + anchoCavidadFinal) / 2;
    const separacion = Math.max(1.4, peralte * 0.6);
    for (const posicion of [margenExtremo + separacion, largo - margenExtremo - separacion]) {
      if (posicion <= margenExtremo + 0.3 || posicion >= largo - margenExtremo - 0.3) continue;
      const punto = mapeo(posicion, centro);
      primitivas.push(
        circuloLocal(punto.x, punto.y, Math.min(0.22, peralte * 0.11), {
          relleno: 'perfilClaro',
          tono: 'perfilDetalle',
          grosor: GROSOR_FINO,
        }),
      );
    }
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
  const pared = Math.min(
    Math.max(params.pared, Math.min(peralte, anchoCara) * 0.09),
    Math.min(peralte, anchoCara) / 3.2,
  );
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

  if (opciones.garganta || opciones.gargantaCentro) {
    const base = opciones.gargantaCentro ? peralte / 2 : ctx.interior === 1 ? peralte : 0;
    const haciaDentro = opciones.gargantaCentro ? 1 : ctx.interior === 1 ? -1 : 1;
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

/**
 * Elevación de una lámina de vidrio o acrílico: panel translúcido con borde y
 * bisel interior, sin reflejos.
 */
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

  // Bisel del canto de la lámina (línea interior fina)
  primitivas.push(
    rect(0.3, 0.3, Math.max(0.1, ancho - 0.6), Math.max(0.1, alto - 0.6), {
      tono: tonoBorde,
      grosor: GROSOR_FINO,
      radio: Math.max(0, radio - 0.2),
      opacidad: 0.45,
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
      radio: Math.min(peralte / 2, 0.14),
    }),
  ];

  if (tipo === 'empaque') {
    // Junta tubular con labios de sellado
    primitivas.push(
      lineaPerfil(mapeo, 0.2, base + haciaDentro * peralte * 0.5, largo - 0.2, base + haciaDentro * peralte * 0.5, {
        tono: 'empaque',
        grosor: GROSOR_FINO,
        opacidad: 0.8,
      }),
    );
    const paso = Math.max(2.5, largo / 24);
    for (let posicion = paso * 0.5; posicion < largo; posicion += paso) {
      primitivas.push(
        lineaPerfil(mapeo, posicion, base, posicion + haciaDentro * peralte * 0.35, base + haciaDentro * peralte * 0.95, {
          tono: 'empaque',
          grosor: GROSOR_FINO,
        }),
      );
    }
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

/** Manija: escudo de anclaje, palanca inclinada y remate. */
function elevacionManija(ctx: ContextoElevacion): Primitiva[] {
  const ancho = ctx.pieza.anchoCm;
  const alto = ctx.pieza.altoCm;
  const yPalanca = alto * 0.58;

  return [
    // Escudo
    rect(ancho * 0.34, alto * 0.1, ancho * 0.32, alto * 0.42, {
      relleno: 'herraje',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
      radio: 0.1,
    }),
    circulo(ancho * 0.5, alto * 0.3, Math.min(ancho, alto) * 0.07, { relleno: 'herrajeOscuro' }),
    // Palanca inclinada
    poligono(
      [
        { x: ancho * 0.22, y: yPalanca + alto * 0.04 },
        { x: ancho * 0.8, y: yPalanca - alto * 0.03 },
        { x: ancho * 0.8, y: yPalanca + alto * 0.06 },
        { x: ancho * 0.22, y: yPalanca + alto * 0.13 },
      ],
      { relleno: 'herraje', tono: 'herrajeOscuro', grosor: GROSOR_FINO },
    ),
    circulo(ancho * 0.79, yPalanca + alto * 0.015, Math.max(0.08, alto * 0.045), {
      relleno: 'herrajeClaro',
      tono: 'herrajeOscuro',
      grosor: GROSOR_FINO,
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
        opacidad: 0.35,
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
const DEFINICIONES: Record<ClasePieza, DefinicionPieza> = {
  vidrio: definicionVidrio,
  acrilico: definicionAcrilico,
  jamba: {
    etiqueta: 'Jamba',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, { canal: 'cerrado', inglete: true, garganta: true, tornillos: true }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  cabezal: {
    etiqueta: 'Cabezal',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, {
        canal: 'cerrado',
        inglete: true,
        garganta: true,
        gotero: true,
        tornillos: true,
      }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  sillar: {
    etiqueta: 'Sillar',
    elevacion: (ctx) =>
      elevacionPerfil(ctx, {
        canal: 'cerrado',
        inglete: true,
        garganta: true,
        peldano: true,
        tornillos: true,
      }),
    seccion: (ctx) => seccionPerfil(ctx, { garganta: true, canal: 'cerrado' }),
  },
  'canal-u': {
    etiqueta: 'Canal U',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'abierto', labios: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'abierto', labios: true }),
  },
  riel: {
    etiqueta: 'Riel',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', labios: true, riel: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado', labios: true }),
  },
  horizontal: {
    etiqueta: 'Horizontal',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', gargantaCentro: true }),
    seccion: (ctx) => seccionPerfil(ctx, { gargantaCentro: true, canal: 'cerrado' }),
  },
  enganche: {
    etiqueta: 'Enganche',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', gancho: true }),
    seccion: (ctx) => seccionPerfil(ctx, { canal: 'cerrado' }),
  },
  traslape: {
    etiqueta: 'Traslape',
    elevacion: (ctx) => elevacionPerfil(ctx, { canal: 'cerrado', recibidor: true }),
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
