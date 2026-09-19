import type { PaletaPiezas } from '../utils/colores';
import type {
  OrientacionPiezaDibujo,
  Punto,
  Primitiva,
  PrimitivaBase,
  TonoPieza,
} from './tipos';

export const GROSOR_FINO = 0.07;
export const GROSOR_MEDIO = 0.1;

type OpcionesTrazo = Omit<PrimitivaBase, 'tipo'>;

export function linea(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opciones: OpcionesTrazo = {},
): Primitiva {
  return { tipo: 'linea', x1, y1, x2, y2, ...opciones };
}

export function rect(
  x: number,
  y: number,
  ancho: number,
  alto: number,
  opciones: OpcionesTrazo & { radio?: number; relleno?: TonoPieza } = {},
): Primitiva {
  const anchoNormalizado = Math.abs(ancho);
  const altoNormalizado = Math.abs(alto);
  return {
    tipo: 'rect',
    x: Math.min(x, x + ancho),
    y: Math.min(y, y + alto),
    ancho: anchoNormalizado,
    alto: altoNormalizado,
    radio: opciones.radio,
    relleno: opciones.relleno,
    tono: opciones.tono,
    grosor: opciones.grosor,
    trazo: opciones.trazo,
    opacidad: opciones.opacidad,
  };
}

export function poligono(
  puntos: Punto[],
  opciones: OpcionesTrazo & { relleno?: TonoPieza } = {},
): Primitiva {
  return { tipo: 'poligono', puntos, ...opciones };
}

export function circulo(
  cx: number,
  cy: number,
  radio: number,
  opciones: OpcionesTrazo & { relleno?: TonoPieza } = {},
): Primitiva {
  return { tipo: 'circulo', cx, cy, radio: Math.max(0.02, radio), ...opciones };
}

export function arco(
  cx: number,
  cy: number,
  radio: number,
  inicio: number,
  fin: number,
  opciones: OpcionesTrazo = {},
): Primitiva {
  return { tipo: 'arco', cx, cy, radio, inicio, fin, ...opciones };
}

/** Traduce coordenadas del perfil (a lo largo, a lo ancho) a coordenadas
 *  locales de la pieza (cm dentro de su bounding box), según la orientación.
 */
export type MapeoPerfil = (largo: number, ancho: number) => Punto;

export function mapeoPerfil(orientacion: OrientacionPiezaDibujo): MapeoPerfil {
  return orientacion === 'horizontal'
    ? (largo, ancho) => ({ x: largo, y: ancho })
    : (largo, ancho) => ({ x: ancho, y: largo });
}

export function rectPerfil(
  mapeo: MapeoPerfil,
  largo: number,
  ancho: number,
  largoMedida: number,
  anchoMedida: number,
  opciones: OpcionesTrazo & { radio?: number; relleno?: TonoPieza } = {},
): Primitiva {
  const esquinaA = mapeo(largo, ancho);
  const esquinaB = mapeo(largo + largoMedida, ancho + anchoMedida);
  return rect(
    Math.min(esquinaA.x, esquinaB.x),
    Math.min(esquinaA.y, esquinaB.y),
    Math.abs(esquinaB.x - esquinaA.x),
    Math.abs(esquinaB.y - esquinaA.y),
    opciones,
  );
}

export function lineaPerfil(
  mapeo: MapeoPerfil,
  largo1: number,
  ancho1: number,
  largo2: number,
  ancho2: number,
  opciones: OpcionesTrazo = {},
): Primitiva {
  const puntoA = mapeo(largo1, ancho1);
  const puntoB = mapeo(largo2, ancho2);
  return linea(puntoA.x, puntoA.y, puntoB.x, puntoB.y, opciones);
}

export function poligonoPerfil(
  mapeo: MapeoPerfil,
  puntos: Array<[number, number]>,
  opciones: OpcionesTrazo & { relleno?: TonoPieza } = {},
): Primitiva {
  return poligono(
    puntos.map(([largo, ancho]) => mapeo(largo, ancho)),
    opciones,
  );
}

/**
 * Interfaz mínima compartida por el contexto 2D nativo y el de Konva, para
 * pintar las primitivas sin acoplarse a una implementación concreta.
 */
export interface ContextoDibujo {
  save(): void;
  restore(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, radio: number): void;
  arc(x: number, y: number, radio: number, inicio: number, fin: number): void;
  fill(): void;
  stroke(): void;
  clip(): void;
  setLineDash(segmentos: number[]): void;
  lineWidth: number;
  lineCap: unknown;
  lineJoin: unknown;
  globalAlpha: number;
  strokeStyle: unknown;
  fillStyle: unknown;
}

function trazarRectanguloRedondeado(
  ctx: ContextoDibujo,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
): void {
  const r = Math.max(0, Math.min(radio, ancho / 2, alto / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + ancho - r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + r, r);
  ctx.lineTo(x + ancho, y + alto - r);
  ctx.arcTo(x + ancho, y + alto, x + ancho - r, y + alto, r);
  ctx.lineTo(x + r, y + alto);
  ctx.arcTo(x, y + alto, x, y + alto - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/** Recorta el dibujo al rectángulo redondeado indicado. */
export function recortarRectangulo(
  ctx: ContextoDibujo,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
): void {
  trazarRectanguloRedondeado(ctx, x, y, ancho, alto, radio);
  ctx.clip();
}

/** Rellena un rectángulo redondeado con color y opacidad (resaltado). */
export function rellenarRectangulo(
  ctx: ContextoDibujo,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number,
  color: string,
  opacidad: number,
): void {
  ctx.save();
  ctx.globalAlpha = opacidad;
  ctx.fillStyle = color;
  trazarRectanguloRedondeado(ctx, x, y, ancho, alto, radio);
  ctx.fill();
  ctx.restore();
}

/** Pinta una lista de primitivas en un contexto 2D (coordenadas en cm). */
export function dibujarPrimitivas(
  ctx: ContextoDibujo,
  primitivas: Primitiva[],
  paleta: PaletaPiezas,
): void {
  for (const primitiva of primitivas) {
    const grosor = primitiva.grosor ?? GROSOR_FINO;
    const colorTrazo = primitiva.tono ? paleta[primitiva.tono] : undefined;
    const colorRelleno =
      'relleno' in primitiva && primitiva.relleno ? paleta[primitiva.relleno] : undefined;

    ctx.save();
    if (primitiva.opacidad !== undefined) {
      ctx.globalAlpha = primitiva.opacidad;
    }
    ctx.lineWidth = grosor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash(primitiva.trazo === 'discontinua' ? [grosor * 5, grosor * 4] : []);

    switch (primitiva.tipo) {
      case 'linea':
        ctx.beginPath();
        ctx.moveTo(primitiva.x1, primitiva.y1);
        ctx.lineTo(primitiva.x2, primitiva.y2);
        if (colorTrazo) {
          ctx.strokeStyle = colorTrazo;
          ctx.stroke();
        }
        break;
      case 'rect':
        trazarRectanguloRedondeado(
          ctx,
          primitiva.x,
          primitiva.y,
          primitiva.ancho,
          primitiva.alto,
          primitiva.radio ?? 0,
        );
        if (colorRelleno) {
          ctx.fillStyle = colorRelleno;
          ctx.fill();
        }
        if (colorTrazo) {
          ctx.strokeStyle = colorTrazo;
          ctx.stroke();
        }
        break;
      case 'poligono':
        ctx.beginPath();
        primitiva.puntos.forEach((punto, indice) => {
          if (indice === 0) {
            ctx.moveTo(punto.x, punto.y);
          } else {
            ctx.lineTo(punto.x, punto.y);
          }
        });
        ctx.closePath();
        if (colorRelleno) {
          ctx.fillStyle = colorRelleno;
          ctx.fill();
        }
        if (colorTrazo) {
          ctx.strokeStyle = colorTrazo;
          ctx.stroke();
        }
        break;
      case 'circulo':
        ctx.beginPath();
        ctx.arc(primitiva.cx, primitiva.cy, primitiva.radio, 0, Math.PI * 2);
        if (colorRelleno) {
          ctx.fillStyle = colorRelleno;
          ctx.fill();
        }
        if (colorTrazo) {
          ctx.strokeStyle = colorTrazo;
          ctx.stroke();
        }
        break;
      case 'arco':
        ctx.beginPath();
        ctx.arc(primitiva.cx, primitiva.cy, primitiva.radio, primitiva.inicio, primitiva.fin);
        if (colorTrazo) {
          ctx.strokeStyle = colorTrazo;
          ctx.stroke();
        }
        break;
    }

    ctx.restore();
  }
}
