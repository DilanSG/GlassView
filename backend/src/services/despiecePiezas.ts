/**
 * Motor de despiece basado en piezas individuales.
 *
 * Todo en el plano es una pieza (perfil, vidrio, rodachina...). Este módulo
 * agrupa las piezas por REF para producir el despiece de la obra, y genera
 * automáticamente el conjunto de piezas de una plantilla (preset) usando las
 * fórmulas del catálogo, colocándolas con una disposición real por modelo:
 * marco exterior, hojas (con sus parales y horizontales) y vidrios encajados.
 */

import type { Pieza } from '../models/Pieza.js';
import {
  calcularDespieceVentaneria,
  obtenerModeloVentaneria,
  type ModeloVentaneria,
  type PiezaDespiece,
  type FormulaMedida,
} from './catalogoVentaneria.js';
import { obtenerPerfilPorRef } from './perfilesVentaneria.js';

export interface LineaPiezaDespiece {
  ref: string;
  descripcion: string;
  tipo: string;
  cantidad: number;
  /** metros lineales totales (largo × cantidad / 100) */
  ml: number;
  precioMetro?: number;
  /** subtotal = ml × precio metro */
  subtotal?: number;
}

export interface VidrioPiezaDespiece {
  descripcion: string;
  espesorMm: number;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  /** área total en metros cuadrados */
  m2: number;
}

export interface DespiecePiezas {
  lineas: LineaPiezaDespiece[];
  vidrios: VidrioPiezaDespiece[];
  totalMl: number;
  totalVidrioM2: number;
  totalHerrajes: number;
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Agrupa las piezas del plano por REF y produce el despiece completo.
 * Los perfiles suman metros lineales; los vidrios suman área; los herrajes
 * (rodachina, manija, empaque...) solo cuentan.
 */
export function calcularDespiecePiezas(piezas: Pieza[]): DespiecePiezas {
  const lineasMap = new Map<string, LineaPiezaDespiece>();
  const vidriosMap = new Map<string, VidrioPiezaDespiece>();

  for (const pieza of piezas) {
    if (pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico') {
      const clave = `${pieza.ref}-${pieza.espesorMm}-${pieza.anchoCm}-${pieza.altoCm}`;
      const existente = vidriosMap.get(clave);
      if (existente) {
        existente.cantidad += pieza.cantidad;
        existente.m2 = redondear(existente.m2 + (pieza.anchoCm * pieza.altoCm * pieza.cantidad) / 10000);
      } else {
        vidriosMap.set(clave, {
          descripcion: pieza.descripcion || pieza.ref,
          espesorMm: pieza.espesorMm ?? 4,
          anchoCm: pieza.anchoCm,
          altoCm: pieza.altoCm,
          cantidad: pieza.cantidad,
          m2: redondear((pieza.anchoCm * pieza.altoCm * pieza.cantidad) / 10000),
        });
      }
      continue;
    }

    if (pieza.tipo === 'rodachina' || pieza.tipo === 'manija') {
      const existente = lineasMap.get(pieza.ref);
      if (existente) {
        existente.cantidad += pieza.cantidad;
      } else {
        const perfil = obtenerPerfilPorRef(pieza.ref);
        lineasMap.set(pieza.ref, {
          ref: pieza.ref,
          descripcion: perfil?.descripcion ?? pieza.descripcion ?? pieza.ref,
          tipo: 'herraje',
          cantidad: pieza.cantidad,
          ml: 0,
        });
      }
      continue;
    }

    const perfil = obtenerPerfilPorRef(pieza.ref);
    const mlPieza = (pieza.largoCm * pieza.cantidad) / 100;
    const existente = lineasMap.get(pieza.ref);
    if (existente) {
      existente.cantidad += pieza.cantidad;
      existente.ml = redondear(existente.ml + mlPieza);
      existente.subtotal = existente.precioMetro
        ? redondear(existente.ml * existente.precioMetro)
        : undefined;
    } else {
      lineasMap.set(pieza.ref, {
        ref: pieza.ref,
        descripcion: perfil?.descripcion ?? pieza.descripcion ?? pieza.ref,
        tipo: 'perfil',
        cantidad: pieza.cantidad,
        ml: redondear(mlPieza),
        precioMetro: perfil?.precioMetro,
        subtotal: perfil?.precioMetro ? redondear(mlPieza * perfil.precioMetro) : undefined,
      });
    }
  }

  const lineas = [...lineasMap.values()];
  const vidrios = [...vidriosMap.values()];
  const totalMl = redondear(lineas.reduce((suma, linea) => suma + linea.ml, 0));
  const totalVidrioM2 = redondear(vidrios.reduce((suma, vidrio) => suma + vidrio.m2, 0));
  const totalHerrajes = lineas
    .filter((linea) => linea.tipo === 'herraje')
    .reduce((suma, linea) => suma + linea.cantidad, 0);

  return { lineas, vidrios, totalMl, totalVidrioM2, totalHerrajes };
}

/**
 * Coloca las piezas de una plantilla en el lienzo con una disposición real:
 * marco exterior (cabezal/sillar/jambas), hojas con sus parales y
 * horizontales, y vidrios encajados dentro de cada hoja. Usa las medidas
 * reales de corte del catálogo y el grosor aproximado del perfil.
 */
function grosorModelo(modelo: ModeloVentaneria): number {
  const descripciones = modelo.piezas.map((p) => `${p.ref} ${p.descripcion}`.toLowerCase());
  // El grosor lo marca el perfil del marco (U 2×1 en P.B.); si no, el tubo.
  if (descripciones.some((d) => /u 2\s*x\s*1/.test(d))) return 5.1;
  if (descripciones.some((d) => /tubo 3\s*x/.test(d))) return 7.6;
  if (descripciones.some((d) => /tubo 1\s*1\/2/.test(d))) return 3.8;
  return 5;
}

interface HojaPieza {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

type DireccionMedida = 'ancho' | 'alto' | 'fija';
type OrientacionPerfil = 'horizontal' | 'vertical';

interface PiezaConBase {
  pieza: PiezaDespiece;
  base: DireccionMedida;
}

/** Centra una pieza de `medida` dentro de `total` (nunca negativo). */
function centrar(medida: number, total: number): number {
  return Math.max(0, Math.round(((total - medida) / 2) * 10) / 10);
}

/** Orientación real de un perfil según su fórmula (ancho/alto) o su nombre. */
function orientacionDe({ pieza, base }: PiezaConBase): OrientacionPerfil {
  if (base === 'ancho') return 'horizontal';
  if (base === 'alto') return 'vertical';
  return /HORIZONTAL|HOR\b|HOR\./i.test(pieza.descripcion) ? 'horizontal' : 'vertical';
}

/** Expande las piezas por su cantidad, conservando el orden del catálogo. */
function expandir(lista: PiezaConBase[]): PiezaDespiece[] {
  const salida: PiezaDespiece[] = [];
  for (const { pieza } of lista) {
    const repeticiones = Math.max(1, Math.round(pieza.cantidad));
    for (let indice = 0; indice < repeticiones; indice += 1) {
      salida.push(pieza);
    }
  }
  return salida;
}

/**
 * Coloca las piezas de una plantilla en el lienzo respetando la disposición
 * real del modelo del Excel: el marco exterior usa las medidas de corte y se
 * centra en el hueco (cabezal/sillar arriba y abajo, jambas a los lados), cada
 * hoja recibe sus rieles y parales según la dirección de su fórmula, y los
 * vidrios se encajan dentro de cada hoja.
 */
export function generarPiezasPreset(
  modeloId: string,
  anchoCm: number,
  altoCm: number,
): Pieza[] {
  const modelo = obtenerModeloVentaneria(modeloId);
  if (!modelo) {
    throw new Error(`Modelo no encontrado: ${modeloId}`);
  }
  const despiece = calcularDespieceVentaneria(modelo, anchoCm, altoCm);
  const piezas: Pieza[] = [];
  const grosor = grosorModelo(modelo);
  const anchoUtil = Math.max(0, anchoCm - grosor * 2);
  const altoUtil = Math.max(0, altoCm - grosor * 2);
  let contador = 0;

  const crearPieza = (
    pieza: PiezaDespiece,
    x: number,
    y: number,
    largo: number,
    orientacion: OrientacionPerfil,
    largoDibujo = largo,
  ): Pieza => {
    contador += 1;
    const largoCorte = Math.round(largo * 10) / 10;
    const largoVisual = Math.round(largoDibujo * 10) / 10;
    return {
      id: `preset-${Date.now()}-${contador}`,
      tipo: 'perfil',
      ref: pieza.ref || pieza.descripcion,
      descripcion: pieza.descripcion,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      largoCm: largoCorte,
      anchoCm: orientacion === 'horizontal' ? largoVisual : grosor,
      altoCm: orientacion === 'vertical' ? largoVisual : grosor,
      orientacion,
      espesorMm: 1,
      cantidad: 1,
      dePreset: true,
    };
  };

  const crearVidrio = (
    vidrio: (typeof despiece.vidrios)[number],
    x: number,
    y: number,
    ancho: number,
    alto: number,
  ): Pieza => {
    contador += 1;
    return {
      id: `preset-${Date.now()}-v${contador}`,
      tipo: vidrio.material,
      ref: vidrio.material === 'vidrio' ? 'VID-4' : 'ACR-4',
      descripcion: vidrio.descripcion,
      x: Math.round(x),
      y: Math.round(y),
      largoCm: 0,
      anchoCm: Math.round(ancho * 10) / 10,
      altoCm: Math.round(alto * 10) / 10,
      orientacion: 'horizontal',
      espesorMm: vidrio.espesorMm,
      cantidad: 1,
      dePreset: true,
    };
  };

  const esAccesorio = (descripcion: string): boolean =>
    /ANGULO|CHAPETA|BARRA|SOPORTE|MANIJA|SEGURO|TORNILL|REMACH|CHAZO|PISAVIDRIO/i.test(
      descripcion,
    ) || /^\s*ADAPTADOR/i.test(descripcion);
  const esMarco = (descripcion: string): boolean =>
    /CABEZAL|SILLAR|BOTAGUA|JAMBA|U 2X1|SUPER ?CORRIDA/i.test(descripcion);
  const esDivisor = (descripcion: string): boolean => /DIVISOR|SEPARADOR/i.test(descripcion);
  const esSuperior = (descripcion: string): boolean => /SUPERIOR|SUP\b|SUP\./i.test(descripcion);
  const esInferior = (descripcion: string): boolean => /INFERIOR|INF\b|INF\./i.test(descripcion);

  // Cada pieza del despiece conserva la dirección de su fórmula en el modelo.
  const conBase: PiezaConBase[] = despiece.piezas.map((pieza, indice) => ({
    pieza,
    base: modelo.piezas[indice]?.medida.base ?? 'fija',
  }));
  const utiles = conBase.filter(({ pieza }) => !esAccesorio(pieza.descripcion));
  const marco = utiles.filter(({ pieza }) => esMarco(pieza.descripcion));

  // ─────────────────── Marco exterior ───────────────────
  const marcoHorizontales = expandir(
    marco.filter((item) => orientacionDe(item) === 'horizontal'),
  );
  const marcoVerticales = expandir(marco.filter((item) => orientacionDe(item) === 'vertical'));

  if (marcoHorizontales.length > 0) {
    const arriba = marcoHorizontales[0];
    piezas.push(
      crearPieza(
        arriba,
        centrar(arriba.medidaCm, anchoCm),
        0,
        arriba.medidaCm,
        'horizontal',
        Math.min(arriba.medidaCm, anchoCm),
      ),
    );
    const abajo = marcoHorizontales[1];
    if (abajo) {
      piezas.push(
        crearPieza(
          abajo,
          centrar(abajo.medidaCm, anchoCm),
          altoCm - grosor,
          abajo.medidaCm,
          'horizontal',
          Math.min(abajo.medidaCm, anchoCm),
        ),
      );
    }
  }

  if (marcoVerticales.length > 0) {
    const izquierda = marcoVerticales[0];
    piezas.push(
      crearPieza(
        izquierda,
        0,
        centrar(izquierda.medidaCm, altoCm),
        izquierda.medidaCm,
        'vertical',
        Math.min(izquierda.medidaCm, altoCm),
      ),
    );
    const derecha = marcoVerticales[1];
    if (derecha) {
      piezas.push(
        crearPieza(
          derecha,
          anchoCm - grosor,
          centrar(derecha.medidaCm, altoCm),
          derecha.medidaCm,
          'vertical',
          Math.min(derecha.medidaCm, altoCm),
        ),
      );
    }
  }

  // ─────────────────── Bandas de hoja ───────────────────
  const hojas =
    modelo.diseno.hojas.length > 0 ? modelo.diseno.hojas : [{ tipo: 'fija', proporcion: 1 }];
  const totalProp = hojas.reduce((suma, hoja) => suma + hoja.proporcion, 0) || 1;
  const apiladas = modelo.diseno.apiladas;

  const bandas: HojaPieza[] = [];
  if (apiladas) {
    let yBanda = grosor;
    for (const hoja of hojas) {
      const altoBanda = (altoUtil * hoja.proporcion) / totalProp;
      bandas.push({ x: grosor, y: yBanda, ancho: anchoUtil, alto: altoBanda });
      yBanda += altoBanda;
    }
  } else {
    let xBanda = grosor;
    for (const hoja of hojas) {
      const anchoBanda = (anchoUtil * hoja.proporcion) / totalProp;
      bandas.push({ x: xBanda, y: grosor, ancho: anchoBanda, alto: altoUtil });
      xBanda += anchoBanda;
    }
  }

  const piezasHoja = utiles.filter(({ pieza }) => !esMarco(pieza.descripcion));
  const divisores = piezasHoja.filter(({ pieza }) => esDivisor(pieza.descripcion));

  if (apiladas && divisores.length > 0) {
    // En modelos apilados el divisor separa las bandas (p. ej. fijo/basculante).
    const listaDivisores = expandir(divisores);
    listaDivisores.forEach((divisor, indice) => {
      const juntura = bandas[indice + 1]?.y;
      if (juntura === undefined) return;
      piezas.push(
        crearPieza(
          divisor,
          centrar(divisor.medidaCm, anchoCm),
          Math.max(0, juntura - grosor / 2),
          divisor.medidaCm,
          'horizontal',
          Math.min(divisor.medidaCm, anchoCm),
        ),
      );
    });
  }

  const hojasSinDivisor = piezasHoja.filter(({ pieza }) => !esDivisor(pieza.descripcion));
  const horizontales = expandir(
    hojasSinDivisor.filter((item) => orientacionDe(item) === 'horizontal'),
  );
  const verticales = expandir(
    hojasSinDivisor.filter((item) => orientacionDe(item) === 'vertical'),
  );

  // Rieles horizontales: si el modelo distingue superior/inferior, cada banda
  // recibe el suyo; si no, se reparten dos por hoja.
  const rielesSuperiores = horizontales.filter((pieza) => esSuperior(pieza.descripcion));
  const rielesInferiores = horizontales.filter((pieza) => esInferior(pieza.descripcion));
  const rielesNeutros = horizontales.filter(
    (pieza) => !esSuperior(pieza.descripcion) && !esInferior(pieza.descripcion),
  );

  bandas.forEach((banda, indiceBanda) => {
    const arriba =
      rielesSuperiores.length > 0
        ? rielesSuperiores[indiceBanda % rielesSuperiores.length]
        : rielesNeutros.length > 0
          ? rielesNeutros[(indiceBanda * 2) % rielesNeutros.length]
          : horizontales[(indiceBanda * 2) % Math.max(1, horizontales.length)];
    const abajo =
      rielesInferiores.length > 0
        ? rielesInferiores[indiceBanda % rielesInferiores.length]
        : rielesNeutros.length > 1
          ? rielesNeutros[(indiceBanda * 2 + 1) % rielesNeutros.length]
          : undefined;

    if (arriba) {
      piezas.push(
        crearPieza(
          arriba,
          banda.x + centrar(arriba.medidaCm, banda.ancho),
          banda.y,
          arriba.medidaCm,
          'horizontal',
          Math.min(arriba.medidaCm, banda.ancho),
        ),
      );
    }
    if (abajo) {
      piezas.push(
        crearPieza(
          abajo,
          banda.x + centrar(abajo.medidaCm, banda.ancho),
          banda.y + banda.alto - grosor,
          abajo.medidaCm,
          'horizontal',
          Math.min(abajo.medidaCm, banda.ancho),
        ),
      );
    }
  });

  // Parales verticales: enganches a un lado y traslapes al otro cuando el
  // modelo los distingue; si no, se reparten por los bordes de cada hoja.
  const enganches = verticales.filter((pieza) => /ENGANCHE/i.test(pieza.descripcion));
  const traslapes = verticales.filter((pieza) => /TRASLAPE/i.test(pieza.descripcion));
  const paralesNeutros = verticales.filter(
    (pieza) => !/ENGANCHE|TRASLAPE/i.test(pieza.descripcion),
  );

  bandas.forEach((banda, indiceBanda) => {
    const izquierda =
      enganches.length > 0
        ? enganches[indiceBanda % enganches.length]
        : paralesNeutros.length > 0
          ? paralesNeutros[(indiceBanda * 2) % paralesNeutros.length]
          : undefined;
    const derecha =
      traslapes.length > 0
        ? traslapes[indiceBanda % traslapes.length]
        : paralesNeutros.length > 1
          ? paralesNeutros[(indiceBanda * 2 + 1) % paralesNeutros.length]
          : undefined;

    if (izquierda) {
      piezas.push(
        crearPieza(
          izquierda,
          banda.x,
          banda.y + centrar(izquierda.medidaCm, banda.alto),
          izquierda.medidaCm,
          'vertical',
          Math.min(izquierda.medidaCm, banda.alto),
        ),
      );
    }
    if (derecha) {
      piezas.push(
        crearPieza(
          derecha,
          banda.x + banda.ancho - grosor,
          banda.y + centrar(derecha.medidaCm, banda.alto),
          derecha.medidaCm,
          'vertical',
          Math.min(derecha.medidaCm, banda.alto),
        ),
      );
    }
  });

  // ─────────────────── Vidrios encajados ───────────────────
  const vidrios = despiece.vidrios.flatMap((vidrio) =>
    Array.from({ length: Math.max(1, Math.round(vidrio.cantidad)) }, () => vidrio),
  );
  const porBanda = new Map<number, (typeof despiece.vidrios)[number][]>();
  vidrios.forEach((vidrio, indice) => {
    const indiceBanda = indice % Math.max(1, bandas.length);
    const lista = porBanda.get(indiceBanda) ?? [];
    lista.push(vidrio);
    porBanda.set(indiceBanda, lista);
  });

  porBanda.forEach((lista, indiceBanda) => {
    const banda = bandas[indiceBanda];
    if (!banda) return;
    const altoTotal = lista.reduce((suma, vidrio) => suma + vidrio.altoCm, 0);
    let yActual = banda.y + Math.max(0, (banda.alto - Math.min(altoTotal, banda.alto)) / 2);
    if (lista.length === 1) {
      yActual = banda.y + Math.max(0, (banda.alto - lista[0].altoCm) / 2);
    }
    lista.forEach((vidrio) => {
      const ancho = Math.min(vidrio.anchoCm, banda.ancho);
      const alto = Math.min(vidrio.altoCm, banda.alto);
      const x = banda.x + Math.max(0, (banda.ancho - ancho) / 2);
      const y = Math.min(Math.max(banda.y, yActual), banda.y + Math.max(0, banda.alto - alto));
      piezas.push(crearVidrio(vidrio, x, y, ancho, alto));
      yActual += alto + grosor / 2;
    });
  });

  return piezas;
}