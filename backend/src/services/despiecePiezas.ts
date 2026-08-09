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
  if (descripciones.some((d) => /tubo 3\s*x/.test(d) || /3\s*x\s*1/.test(d))) return 7.6;
  if (descripciones.some((d) => /tubo 1\s*1\/2/.test(d) || /1\s*1\/2/.test(d))) return 3.8;
  if (descripciones.some((d) => /u 2\s*x\s*1/.test(d) || /2\s*x\s*1/.test(d))) return 5.1;
  return 5;
}

interface HojaPieza {
  x: number;
  y: number;
  ancho: number;
  alto: number;
}

/**
 * Coloca las piezas de una plantilla en el lienzo con una disposición real:
 * marco exterior (cabezal/sillar/jambas), bandas de hoja según el diseño y los
 * vidrios encajados en cada banda. Usa el grosor real del perfil (tubular en
 * pulgadas) y las fórmulas de corte verificadas contra el Excel.
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
  let contador = 0;

  const esAccesorio = (descripcion: string): boolean =>
    /ANGULO|CHAPETA|BARRA|SOPORTE|MANIJA|SEGURO|TORNILL|REMACH|CHAZO|PISAVIDRIO|ADAPTADOR/i.test(
      descripcion,
    );

  const iterarPiezas = <T>(
    lista: PiezaDespiece[],
    fn: (pieza: PiezaDespiece, indice: number) => T,
  ): T[] => {
    const salida: T[] = [];
    let indice = 0;
    for (const pieza of lista) {
      for (let i = 0; i < pieza.cantidad; i += 1) {
        salida.push(fn(pieza, indice));
        indice += 1;
      }
    }
    return salida;
  };

  const crearPieza = (
    pieza: PiezaDespiece,
    x: number,
    y: number,
    largo: number,
    orientacion: 'horizontal' | 'vertical',
  ): Pieza => {
    contador += 1;
    const largoRedondeado = Math.round(largo * 10) / 10;
    return {
      id: `preset-${Date.now()}-${contador}`,
      tipo: 'perfil',
      ref: pieza.ref || pieza.descripcion,
      descripcion: pieza.descripcion,
      x: Math.round(x),
      y: Math.round(y),
      largoCm: largoRedondeado,
      orientacion,
      anchoCm: orientacion === 'horizontal' ? largoRedondeado : grosor,
      altoCm: orientacion === 'vertical' ? largoRedondeado : grosor,
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

  const anchoUtil = Math.max(0, anchoCm - grosor * 2);
  const altoUtil = Math.max(0, altoCm - grosor * 2);

  const noMarco = despiece.piezas.filter((p) => !esAccesorio(p.descripcion));

  // ─────────────────── Marco exterior ───────────────────
  // Tres frentes fijos: cabezal (top), sillar (bottom) y jambas (laterales).
  const vert = noMarco.filter(
    (p) => /JAMBA|BOTAGUA|U 2/i.test(p.descripcion) && p.medidaCm >= altoCm - grosor,
  );
  const top = noMarco.find(
    (p) => /CABEZAL/i.test(p.descripcion) && Math.abs(p.medidaCm - anchoCm) < 1,
  );
  const bottom = noMarco.find(
    (p) =>
      (/SILLAR/i.test(p.descripcion) || /BOTAGUA/i.test(p.descripcion)) &&
      Math.abs(p.medidaCm - anchoCm) < 1.5,
  );

  if (top) {
    piezas.push(crearPieza(top, grosor, 0, top.medidaCm, 'horizontal'));
  }
  if (bottom && bottom !== top) {
    piezas.push(crearPieza(bottom, grosor, altoCm - grosor, bottom.medidaCm, 'horizontal'));
  }

  const jambaIzq = vert[0];
  const jambaDer = vert[1] ?? vert[0];
  if (jambaIzq) {
    piezas.push(crearPieza(jambaIzq, 0, grosor, jambaIzq.medidaCm, 'vertical'));
  }
  if (jambaDer && jambaDer !== jambaIzq) {
    piezas.push(crearPieza(jambaDer, anchoCm - grosor, grosor, jambaDer.medidaCm, 'vertical'));
  }

  // Si no hay jambas declaradas (modelos apilados de 3831 usan perfiles de
  // cabezal en vertical), se forman los parales laterales internos.
  const hojas = modelo.diseno.hojas.length > 0 ? modelo.diseno.hojas : [{ tipo: 'fija', proporcion: 1 }];
  const totalProp = hojas.reduce((s, h) => s + h.proporcion, 0) || 1;
  const apiladas = modelo.diseno.apiladas;

  // ─────────────────── Bandas de hoja ───────────────────
  const bandas: HojaPieza[] = [];
  if (apiladas) {
    let yA = grosor;
    for (const hoja of hojas) {
      const altoB = (altoUtil * hoja.proporcion) / totalProp;
      bandas.push({ x: grosor, y: yA, ancho: anchoUtil, alto: altoB });
      yA += altoB;
    }
  } else {
    let xA = grosor;
    for (const hoja of hojas) {
      const anchoB = (anchoUtil * hoja.proporcion) / totalProp;
      bandas.push({ x: xA, y: grosor, ancho: anchoB, alto: altoUtil });
      xA += anchoB;
    }
  }

    // Parales interiores: verticales que dividen hojas, repartidos entre bandas.
  // `despiece.piezas` y `modelo.piezas` comparten orden: se emparejan por índice
  // para conocer la base de la medida ('ancho' | 'alto' | 'fija').
  const parales = despiece.piezas
    .map((pieza, indice) => ({ pieza, base: modelo.piezas[indice]?.medida.base }))
    .filter(
      ({ pieza, base }) =>
        base === 'alto' && /ENGANCHE|TRASLAPE|PARAL|DIVISOR/i.test(pieza.descripcion),
    );
  const paralesExpandidos = iterarPiezas(
    parales.map((p) => p.pieza),
    (p, i) => ({ pieza: p, i }),
  );
  // Costuras: borde izquierdo, quiebres entre bandas y borde derecho.
  const costuras = [grosor, ...bandas.slice(1).map((b) => b.x), anchoCm - grosor];
  paralesExpandidos.forEach(({ pieza: v }, indice) => {
    const costura = costuras[indice % costuras.length];
    // En la misma costura caben dos hojas superpuestas (enganche+traslape);
    // se separan ligeramente para verse como dos perfiles.
    const bloque = Math.floor(indice / Math.max(1, costuras.length));
    const x = costura + (bloque % 2 === 0 ? -grosor / 3 : grosor / 3);
    const largoM = Math.max(0, Math.min(v.medidaCm, altoUtil));
    const posY = grosor + (altoUtil - largoM) / 2;
    piezas.push(crearPieza(v, Math.min(anchoCm - grosor, Math.max(grosor, x)), Math.max(grosor, posY), largoM, 'vertical'));
  });

  // ─────────────────── Horizontales de hoja ───────────────────
  const horizontales = despiece.piezas
    .map((pieza, indice) => ({ pieza, base: modelo.piezas[indice]?.medida.base }))
    .filter(
      ({ pieza, base }) =>
        base === 'ancho' &&
        !/CABEZAL|SILLAR/i.test(pieza.descripcion) &&
        /HORIZONTAL|HOR /i.test(pieza.descripcion),
    )
    .map(({ pieza }) => pieza);
  const horizontalesExpandidos = iterarPiezas(horizontales, (p, i) => ({ pieza: p, i }));
  let idxH = 0;
  for (let b = 0; b < bandas.length; b += 1) {
    const banda = bandas[b];
    const arriba = horizontalesExpandidos[idxH % horizontalesExpandidos.length];
    const abajo = horizontalesExpandidos[(idxH + 1) % horizontalesExpandidos.length];
    if (arriba) {
      const ajusteX = Math.max(0, banda.ancho - arriba.pieza.medidaCm) / 2;
      piezas.push(
        crearPieza(arriba.pieza, banda.x + ajusteX, banda.y, arriba.pieza.medidaCm, 'horizontal'),
      );
    }
    if (abajo) {
      const ajusteX = Math.max(0, banda.ancho - abajo.pieza.medidaCm) / 2;
      piezas.push(
        crearPieza(abajo.pieza, banda.x + ajusteX, banda.y + banda.alto - grosor, abajo.pieza.medidaCm, 'horizontal'),
      );
    }
    idxH += 2;
  }

  // ─────────────────── Vidrios encajados ───────────────────
  const vidrios = despiece.vidrios.flatMap((v) =>
    Array.from({ length: v.cantidad }, () => v),
  );
  // Agrupa vidrios por banda: si hay varios en la misma banda (p. ej. P.B.
  // con dos paños), se reparten apilados verticalmente. Se mantienen las
  // medidas reales (las correderas se superponen en el centro) y solo se
  // fija la posición dentro del marco exterior.
  const porBanda = new Map<number, (typeof despiece.vidrios)[number][]>();
  vidrios.forEach((vidrio, i) => {
    const indiceBanda = i % Math.max(1, bandas.length);
    const lista = porBanda.get(indiceBanda) ?? [];
    lista.push(vidrio);
    porBanda.set(indiceBanda, lista);
  });
  porBanda.forEach((lista, indiceBanda) => {
    const banda = bandas[indiceBanda];
    if (!banda) return;
    const totalAlto = lista.reduce((suma, v) => suma + v.altoCm, 0);
    let yActual =
      banda.y +
      (banda.alto - Math.min(totalAlto, banda.alto)) / 2;
    if (lista.length === 1) {
      const vidrio = lista[0];
      yActual = banda.y + (banda.alto - vidrio.altoCm) / 2;
    }
    lista.forEach((vidrio) => {
      const x = banda.x + (banda.ancho - vidrio.anchoCm) / 2;
      const y = Math.max(grosor, yActual);
      piezas.push(crearVidrio(vidrio, x, y, vidrio.anchoCm, vidrio.altoCm));
      yActual += vidrio.altoCm + grosor / 2;
    });
  });

  return piezas;
}