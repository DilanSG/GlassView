import { jsPDF } from 'jspdf';
import type { HuecoProyecto, PerfilVentaneria, PiezaPlano } from '../tipos';
import { crearContextosPiezas } from '../piezas/contexto';
import { construirElevacion } from '../piezas/elevacion';
import type { Primitiva, TonoPieza } from '../piezas/tipos';
import { colorARgb } from '../utils/colores';

interface Tramo {
  inicio: number;
  fin: number;
}

export interface OpcionesPdfPlano {
  hueco?: HuecoProyecto | null;
  cliente?: string;
  direccion?: string;
  fecha?: Date;
}

interface ColumnaTabla {
  titulo: string;
  ancho: number;
  alinear?: 'left' | 'center' | 'right';
}

/** Colores de impresión (fondo blanco) para los tonos de las piezas. */
const PALETA_PDF: Record<TonoPieza, [number, number, number]> = {
  perfil: [214, 216, 220],
  perfilClaro: [233, 235, 238],
  perfilOscuro: [180, 184, 190],
  perfilBorde: [110, 114, 120],
  perfilDetalle: [140, 144, 150],
  corte: [226, 229, 232],
  vidrio: [214, 235, 247],
  vidrioBorde: [63, 136, 184],
  vidrioBrillo: [255, 255, 255],
  acrilico: [214, 240, 244],
  acrilicoBorde: [63, 151, 168],
  herraje: [174, 180, 187],
  herrajeClaro: [217, 221, 225],
  herrajeOscuro: [86, 92, 100],
  empaque: [79, 82, 87],
};

const MARGEN = 12;
const ALTO_FILA = 5.8;
const ALTO_CABECERA = 6.6;

/** Grupo de taller al que pertenece cada familia de pieza (como en el despiece). */
type GrupoDespiece = 'MARCO' | 'HOJAS' | 'OTROS PERFILES' | 'EMPAQUE' | 'VIDRIOS' | 'HERRAJES';

const GRUPO_POR_CATEGORIA: Record<string, GrupoDespiece> = {
  cabezal: 'MARCO',
  sillar: 'MARCO',
  jamba: 'MARCO',
  hoja: 'HOJAS',
  horizontal: 'HOJAS',
  vidrio: 'VIDRIOS',
  acrilico: 'VIDRIOS',
  empaque: 'EMPAQUE',
  rodachina: 'HERRAJES',
  manija: 'HERRAJES',
  herraje: 'HERRAJES',
  riel: 'OTROS PERFILES',
  'canal-u': 'OTROS PERFILES',
  tubo: 'OTROS PERFILES',
  otro: 'OTROS PERFILES',
};

const ORDEN_GRUPOS: GrupoDespiece[] = [
  'MARCO',
  'HOJAS',
  'OTROS PERFILES',
  'EMPAQUE',
  'VIDRIOS',
  'HERRAJES',
];

function redondear(valor: number, decimales = 1): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}

function formatearCm(valor: number): string {
  return `${redondear(valor, 1)} cm`;
}

/** Número de cota sin unidad y con coma decimal: «12,5» (la unidad va en el pie). */
function numeroCota(valor: number): string {
  return redondear(valor, 1).toFixed(1).replace('.', ',');
}

function formatearMl(valor: number): string {
  return `${redondear(valor, 2)} ml`;
}

function formatearM2(valor: number): string {
  return `${redondear(valor, 2)} m²`;
}

function esVidrio(pieza: PiezaPlano): boolean {
  return pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico';
}

function esHerraje(pieza: PiezaPlano): boolean {
  return pieza.orientacion === 'punto' || pieza.tipo === 'rodachina' || pieza.tipo === 'manija';
}

function categoriaDe(pieza: PiezaPlano, perfiles: PerfilVentaneria[]): string {
  const perfil = perfiles.find((candidato) => candidato.ref === pieza.ref);
  if (perfil) return perfil.categoria;
  if (esVidrio(pieza)) return 'vidrio';
  if (esHerraje(pieza)) return 'herraje';
  return 'otro';
}

function descripcionDe(pieza: PiezaPlano): string {
  return pieza.descripcion || pieza.ref || pieza.tipo;
}

/** Medida principal de la pieza para tablas y etiquetas. */
function medidaDe(pieza: PiezaPlano): string {
  if (pieza.orientacion === 'punto') return 'Punto';
  if (esVidrio(pieza)) return `${redondear(pieza.anchoCm)} × ${redondear(pieza.altoCm)} cm`;
  return `${redondear(pieza.anchoCm)} × ${redondear(pieza.altoCm)} cm`;
}

function posicionDe(pieza: PiezaPlano): string {
  return `x ${redondear(pieza.x)} · y ${redondear(pieza.y)}`;
}

/**
 * Calcula los tramos de cota a lo largo de un eje usando las aristas
 * interiores compartidas: donde una pieza termina y otra empieza se coloca
 * una división. La suma de los tramos es el total del plano.
 */
function tramosEje(
  piezas: PiezaPlano[],
  orientacion: 'ancho' | 'alto',
  minimo: number,
  maximo: number,
): Tramo[] {
  const inicios = new Set<number>();
  const fines = new Set<number>();
  piezas.forEach((pieza) => {
    if (pieza.orientacion === 'punto') return;
    const ini = orientacion === 'ancho' ? pieza.x : pieza.y;
    const fin = orientacion === 'ancho' ? pieza.x + pieza.anchoCm : pieza.y + pieza.altoCm;
    inicios.add(ini);
    fines.add(fin);
  });
  const divisiones = [...fines]
    .filter((valor) => inicios.has(valor) && valor > minimo + 0.0001 && valor < maximo - 0.0001)
    .sort((a, b) => a - b);
  const seleccionadas: number[] = [];
  for (const division of divisiones) {
    // Divisiones a menos de 1 cm de la anterior se descartan: con números
    // pequeños caben más cotas y no se solapan.
    if (seleccionadas.length === 0 || division - seleccionadas[seleccionadas.length - 1] > 1) {
      seleccionadas.push(division);
    }
  }
  const tramos: Tramo[] = [];
  let anterior = minimo;
  seleccionadas.forEach((division) => {
    tramos.push({ inicio: anterior, fin: division });
    anterior = division;
  });
  tramos.push({ inicio: anterior, fin: maximo });
  return tramos;
}

/** Dibuja una línea de cota (con sus tramos y textos) dentro del PDF. */
function dibujarCotaPdf(
  pdf: jsPDF,
  horizontal: boolean,
  tramos: Tramo[],
  posicionLinea: number,
  mapearCm: (cm: number) => number,
  desplazamientoEtiqueta: number,
  grosor = 0.25,
  tamanioTexto = 7.2,
): void {
  const puntos = tramos.flatMap((tramo) => [mapearCm(tramo.inicio), mapearCm(tramo.fin)]);
  const ini = Math.min(...puntos);
  const fin = Math.max(...puntos);

  pdf.setDrawColor(25, 25, 28);
  pdf.setLineWidth(grosor);
  if (horizontal) {
    pdf.line(ini, posicionLinea, fin, posicionLinea);
  } else {
    pdf.line(posicionLinea, ini, posicionLinea, fin);
  }

  // Marcas en cada división, ligeramente inclinadas como en un plano técnico.
  tramos.forEach((tramo) => {
    [tramo.inicio, tramo.fin].forEach((cm) => {
      const punto = mapearCm(cm);
      if (horizontal) {
        pdf.line(punto - 0.7, posicionLinea + 1.1, punto + 0.7, posicionLinea - 1.1);
      } else {
        pdf.line(posicionLinea - 1.1, punto + 0.7, posicionLinea + 1.1, punto - 0.7);
      }
    });
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(tamanioTexto);
  pdf.setTextColor(20, 20, 22);
  tramos.forEach((tramo) => {
    const inicio = mapearCm(tramo.inicio);
    const fin = mapearCm(tramo.fin);
    const medio = (inicio + fin) / 2;
    // Con números pequeños caben más cotas: solo se omite si el tramo es muy fino.
    if (fin - inicio < 5.5) return;
    const texto = numeroCota(tramo.fin - tramo.inicio);
    if (horizontal) {
      pdf.text(texto, medio, posicionLinea + desplazamientoEtiqueta, { align: 'center' });
    } else {
      pdf.text(texto, posicionLinea + desplazamientoEtiqueta, medio, {
        align: 'center',
        angle: 90,
      });
    }
  });
}

/** Dibuja las primitivas de una pieza en el PDF (coordenadas en cm → mm). */
function dibujarPrimitivasPdf(
  pdf: jsPDF,
  primitivas: Primitiva[],
  mapearX: (cm: number) => number,
  mapearY: (cm: number) => number,
  escala: number,
): void {
  for (const primitiva of primitivas) {
    const grosor = Math.max(0.1, (primitiva.grosor ?? 0.07) * escala);
    const colorTrazo = primitiva.tonoColor
      ? colorARgb(primitiva.tonoColor)
      : primitiva.tono
        ? PALETA_PDF[primitiva.tono]
        : undefined;
    if (colorTrazo) {
      pdf.setDrawColor(colorTrazo[0], colorTrazo[1], colorTrazo[2]);
    }
    const rellenoColor =
      'rellenoColor' in primitiva && primitiva.rellenoColor
        ? colorARgb(primitiva.rellenoColor)
        : 'relleno' in primitiva && primitiva.relleno
          ? PALETA_PDF[primitiva.relleno]
          : undefined;
    if (rellenoColor) {
      pdf.setFillColor(rellenoColor[0], rellenoColor[1], rellenoColor[2]);
    }
    const hayRelleno = Boolean(rellenoColor);
    const hayTrazo = Boolean(colorTrazo);
    pdf.setLineWidth(grosor);
    if (primitiva.trazo === 'discontinua') {
      pdf.setLineDashPattern([Math.max(0.4, grosor * 4), Math.max(0.3, grosor * 3)], 0);
    } else {
      pdf.setLineDashPattern([], 0);
    }

    switch (primitiva.tipo) {
      case 'linea':
        if (hayTrazo) {
          pdf.line(
            mapearX(primitiva.x1),
            mapearY(primitiva.y1),
            mapearX(primitiva.x2),
            mapearY(primitiva.y2),
          );
        }
        break;
      case 'rect': {
        const estilo = `${hayRelleno ? 'F' : ''}${hayTrazo ? 'D' : ''}` || 'S';
        const radio = (primitiva.radio ?? 0) * escala;
        pdf.roundedRect(
          mapearX(primitiva.x),
          mapearY(primitiva.y),
          primitiva.ancho * escala,
          primitiva.alto * escala,
          radio,
          radio,
          estilo,
        );
        break;
      }
      case 'poligono': {
        const puntos = primitiva.puntos.map(
          (punto) => [mapearX(punto.x), mapearY(punto.y)] as [number, number],
        );
        if (puntos.length < 2) break;
        const estilo = `${hayRelleno ? 'F' : ''}${hayTrazo ? 'D' : ''}` || 'S';
        const deltas: number[][] = [];
        for (let indice = 1; indice < puntos.length; indice += 1) {
          deltas.push([
            puntos[indice][0] - puntos[indice - 1][0],
            puntos[indice][1] - puntos[indice - 1][1],
          ]);
        }
        deltas.push([
          puntos[0][0] - puntos[puntos.length - 1][0],
          puntos[0][1] - puntos[puntos.length - 1][1],
        ]);
        pdf.lines(deltas, puntos[0][0], puntos[0][1], [1, 1], estilo, true);
        break;
      }
      case 'circulo': {
        const estilo = `${hayRelleno ? 'F' : ''}${hayTrazo ? 'D' : ''}` || 'S';
        pdf.circle(mapearX(primitiva.cx), mapearY(primitiva.cy), primitiva.radio * escala, estilo);
        break;
      }
      case 'arco': {
        const pasos = 12;
        let anterior: [number, number] | null = null;
        for (let indice = 0; indice <= pasos; indice += 1) {
          const angulo = primitiva.inicio + ((primitiva.fin - primitiva.inicio) * indice) / pasos;
          const punto: [number, number] = [
            mapearX(primitiva.cx + primitiva.radio * Math.cos(angulo)),
            mapearY(primitiva.cy + primitiva.radio * Math.sin(angulo)),
          ];
          if (anterior && hayTrazo) {
            pdf.line(anterior[0], anterior[1], punto[0], punto[1]);
          }
          anterior = punto;
        }
        break;
      }
    }
  }
  pdf.setLineDashPattern([], 0);
}

/** Chip numerado de cada pieza y su medida, enlazados con la tabla de detalle. */
function dibujarEtiquetasPiezas(
  pdf: jsPDF,
  piezas: PiezaPlano[],
  mapearX: (cm: number) => number,
  mapearY: (cm: number) => number,
  escala: number,
): void {
  piezas.forEach((pieza, indice) => {
    const x0 = mapearX(pieza.x);
    const y0 = mapearY(pieza.y);
    const ancho = (pieza.anchoCm || 0) * escala;
    const alto = (pieza.altoCm || 0) * escala;
    const esPunto = pieza.orientacion === 'punto';
    const centroX = x0 + ancho / 2;
    const centroY = y0 + alto / 2;

    // Medida de la pieza, en pequeño y centrada, solo si el hueco da espacio.
    if (!esPunto && ancho >= 18 && alto >= 9) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(5.2);
      pdf.setTextColor(70, 72, 76);
      pdf.text(
        `${redondear(pieza.anchoCm)}×${redondear(pieza.altoCm)}`,
        centroX,
        centroY + 1,
        { align: 'center' },
      );
    }

    // Número de la pieza: en la esquina para no tapar la medida.
    const radio = 2.3;
    const enEsquina = !esPunto && ancho >= 14 && alto >= 14;
    const chipX = enEsquina ? x0 + radio + 0.8 : centroX;
    const chipY = enEsquina ? y0 + radio + 0.8 : centroY;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.2);
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(25, 25, 28);
    pdf.setLineWidth(0.2);
    pdf.circle(chipX, chipY, radio, 'FD');
    pdf.setTextColor(20, 20, 22);
    pdf.text(String(indice + 1), chipX, chipY + 1.6, { align: 'center' });
  });
}

/** Dibuja una tabla con cabecera, filas alternas y salto de página automático. */
function dibujarTabla(
  pdf: jsPDF,
  y: number,
  titulo: string,
  columnas: ColumnaTabla[],
  filas: string[][],
): number {
  if (filas.length === 0) return y;
  const altoPagina = pdf.internal.pageSize.getHeight();
  const anchoTotal = columnas.reduce((total, columna) => total + columna.ancho, 0);
  const x0 = MARGEN;
  let actual = y;

  const escribirCabecera = (texto: string): void => {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10.5);
    pdf.setTextColor(20, 20, 22);
    pdf.text(texto, x0, actual);
    actual += 4;

    pdf.setFillColor(236, 237, 240);
    pdf.rect(x0, actual, anchoTotal, ALTO_CABECERA, 'F');
    pdf.setDrawColor(120, 122, 126);
    pdf.setLineWidth(0.2);
    pdf.line(x0, actual + ALTO_CABECERA, x0 + anchoTotal, actual + ALTO_CABECERA);
    pdf.setFontSize(7.4);
    let x = x0;
    columnas.forEach((columna) => {
      const tx =
        columna.alinear === 'right'
          ? x + columna.ancho - 1.5
          : columna.alinear === 'center'
            ? x + columna.ancho / 2
            : x + 1.5;
      pdf.text(columna.titulo.toUpperCase(), tx, actual + 4.4, {
        align: columna.alinear ?? 'left',
      });
      x += columna.ancho;
    });
    actual += ALTO_CABECERA;
  };

  escribirCabecera(titulo);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.6);

  filas.forEach((fila, indice) => {
    if (actual + ALTO_FILA > altoPagina - MARGEN - 4) {
      pdf.addPage('a4', 'portrait');
      actual = MARGEN + 4;
      escribirCabecera(`${titulo} (continuación)`);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.6);
    }
    if (indice % 2 === 1) {
      pdf.setFillColor(247, 248, 250);
      pdf.rect(x0, actual, anchoTotal, ALTO_FILA, 'F');
    }
    pdf.setTextColor(35, 35, 38);
    let x = x0;
    fila.forEach((celda, columnaIndice) => {
      const columna = columnas[columnaIndice];
      const tx =
        columna.alinear === 'right'
          ? x + columna.ancho - 1.5
          : columna.alinear === 'center'
            ? x + columna.ancho / 2
            : x + 1.5;
      pdf.text(celda, tx, actual + 4.1, { align: columna.alinear ?? 'left' });
      x += columna.ancho;
    });
    pdf.setDrawColor(214, 215, 218);
    pdf.setLineWidth(0.1);
    pdf.line(x0, actual + ALTO_FILA, x0 + anchoTotal, actual + ALTO_FILA);
    actual += ALTO_FILA;
  });

  return actual + 7;
}

/** Totales de la obra: piezas, metros lineales, superficie de vidrio y herrajes. */
function resumenObra(piezas: PiezaPlano[]): {
  total: number;
  perfiles: number;
  metrosLineales: number;
  vidrios: number;
  vidrioM2: number;
  herrajes: number;
} {
  let perfiles = 0;
  let metrosLineales = 0;
  let vidrios = 0;
  let vidrioM2 = 0;
  let herrajes = 0;
  for (const pieza of piezas) {
    const cantidad = pieza.cantidad || 1;
    if (esVidrio(pieza)) {
      vidrios += 1;
      vidrioM2 += ((pieza.anchoCm || 0) * (pieza.altoCm || 0) * cantidad) / 10000;
    } else if (esHerraje(pieza)) {
      herrajes += cantidad;
    } else {
      perfiles += 1;
      metrosLineales += ((pieza.largoCm || 0) * cantidad) / 100;
    }
  }
  return {
    total: piezas.length,
    perfiles,
    metrosLineales: redondear(metrosLineales, 2),
    vidrios,
    vidrioM2: redondear(vidrioM2, 2),
    herrajes,
  };
}

interface LineaCorte {
  ref: string;
  descripcion: string;
  largoCm: number;
  cantidad: number;
  ml: number;
}

/**
 * Despiece de perfiles agrupado por REF y longitud de corte, clasificado en los
 * grupos del taller: MARCO (cabezal, sillar, jamba), HOJAS (enganche, traslape,
 * horizontal), OTROS PERFILES y EMPAQUE.
 */
function cortesPorGrupo(
  piezas: PiezaPlano[],
  perfiles: PerfilVentaneria[],
): Map<GrupoDespiece, LineaCorte[]> {
  const grupos = new Map<GrupoDespiece, Map<string, LineaCorte>>();
  for (const pieza of piezas) {
    if (esVidrio(pieza) || esHerraje(pieza)) continue;
    const categoria = categoriaDe(pieza, perfiles);
    const grupo = GRUPO_POR_CATEGORIA[categoria] ?? 'OTROS PERFILES';
    const largo = pieza.largoCm || Math.max(pieza.anchoCm, pieza.altoCm);
    const clave = `${pieza.ref}|${redondear(largo, 1)}`;
    const cantidad = pieza.cantidad || 1;
    const mapa = grupos.get(grupo) ?? new Map<string, LineaCorte>();
    const existente = mapa.get(clave);
    if (existente) {
      existente.cantidad += cantidad;
      existente.ml = redondear(existente.ml + (largo * cantidad) / 100, 2);
    } else {
      const perfil = perfiles.find((candidato) => candidato.ref === pieza.ref);
      mapa.set(clave, {
        ref: pieza.ref,
        descripcion: perfil?.descripcion ?? descripcionDe(pieza),
        largoCm: redondear(largo, 1),
        cantidad,
        ml: redondear((largo * cantidad) / 100, 2),
      });
    }
    grupos.set(grupo, mapa);
  }

  const resultado = new Map<GrupoDespiece, LineaCorte[]>();
  ORDEN_GRUPOS.forEach((grupo) => {
    const mapa = grupos.get(grupo);
    if (mapa) {
      resultado.set(
        grupo,
        [...mapa.values()].sort((a, b) => a.ref.localeCompare(b.ref) || b.largoCm - a.largoCm),
      );
    }
  });
  return resultado;
}

interface LineaVidrio {
  descripcion: string;
  espesorMm: number;
  anchoCm: number;
  altoCm: number;
  cantidad: number;
  m2: number;
}

/** Vidrios agrupados por espesor y medida exacta. */
function listaVidrios(piezas: PiezaPlano[]): LineaVidrio[] {
  const mapa = new Map<string, LineaVidrio>();
  for (const pieza of piezas) {
    if (!esVidrio(pieza)) continue;
    const clave = `${pieza.tipo}|${pieza.espesorMm}|${redondear(pieza.anchoCm)}|${redondear(pieza.altoCm)}`;
    const cantidad = pieza.cantidad || 1;
    const existente = mapa.get(clave);
    if (existente) {
      existente.cantidad += cantidad;
      existente.m2 = redondear(existente.m2 + (pieza.anchoCm * pieza.altoCm * cantidad) / 10000, 2);
    } else {
      mapa.set(clave, {
        descripcion: descripcionDe(pieza),
        espesorMm: pieza.espesorMm ?? 4,
        anchoCm: redondear(pieza.anchoCm),
        altoCm: redondear(pieza.altoCm),
        cantidad,
        m2: redondear((pieza.anchoCm * pieza.altoCm * cantidad) / 10000, 2),
      });
    }
  }
  return [...mapa.values()].sort((a, b) => a.espesorMm - b.espesorMm);
}

interface LineaHerraje {
  ref: string;
  descripcion: string;
  cantidad: number;
}

/** Herrajes agrupados por REF. */
function listaHerrajes(piezas: PiezaPlano[], perfiles: PerfilVentaneria[]): LineaHerraje[] {
  const mapa = new Map<string, LineaHerraje>();
  for (const pieza of piezas) {
    if (!esHerraje(pieza)) continue;
    const cantidad = pieza.cantidad || 1;
    const existente = mapa.get(pieza.ref);
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      const perfil = perfiles.find((candidato) => candidato.ref === pieza.ref);
      mapa.set(pieza.ref, {
        ref: pieza.ref,
        descripcion: perfil?.descripcion ?? descripcionDe(pieza),
        cantidad,
      });
    }
  }
  return [...mapa.values()].sort((a, b) => a.ref.localeCompare(b.ref));
}

/**
 * Construye el PDF del plano: cotas, etiquetas por pieza, tablas de medidas,
 * despiece (cortes, vidrios y herrajes) y notas de montaje. Devuelve null si
 * no hay ninguna pieza dibujable.
 */
export function crearPlanoPdf(
  piezas: PiezaPlano[],
  piezaSeleccionada: PiezaPlano | null,
  nombrePlano: string,
  perfiles: PerfilVentaneria[] = [],
  opciones: OpcionesPdfPlano = {},
): jsPDF | null {
  const rectangulos = piezas.filter(
    (pieza) => pieza.orientacion !== 'punto' && pieza.anchoCm > 0 && pieza.altoCm > 0,
  );
  if (rectangulos.length === 0) return null;

  const xMin = Math.min(...rectangulos.map((p) => p.x));
  const xMax = Math.max(...rectangulos.map((p) => p.x + p.anchoCm));
  const yMin = Math.min(...rectangulos.map((p) => p.y));
  const yMax = Math.max(...rectangulos.map((p) => p.y + p.altoCm));
  const anchoObra = xMax - xMin;
  const altoObra = yMax - yMin;

  const esHorizontal = anchoObra >= altoObra;
  const pdf = new jsPDF({
    orientation: esHorizontal ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();

  const resumen = resumenObra(piezas);

  // ── Cabecera informativa ────────────────────────────────────────────────
  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, anchoPagina, altoPagina, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(90, 92, 96);
  pdf.text('GLASSVIEW · ©IntoCode', MARGEN, MARGEN + 1);

  pdf.setFontSize(15);
  pdf.setTextColor(20, 20, 22);
  pdf.text(`Plano de instalación — ${nombrePlano}`, MARGEN, MARGEN + 8);

  const fecha = opciones.fecha ?? new Date();
  const lineaDatos = [
    opciones.cliente ? `Cliente: ${opciones.cliente}` : '',
    opciones.direccion ? `Obra: ${opciones.direccion}` : '',
    `Fecha: ${fecha.toLocaleDateString('es-ES')}`,
  ]
    .filter(Boolean)
    .join('   ·   ');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.4);
  pdf.setTextColor(70, 72, 76);
  if (lineaDatos) {
    pdf.text(lineaDatos, MARGEN, MARGEN + 13.5);
  }

  const hueco = opciones.hueco;
  const medidasAncho = hueco && hueco.anchoCm > 0 ? hueco.anchoCm : anchoObra;
  const medidasAlto = hueco && hueco.altoCm > 0 ? hueco.altoCm : altoObra;
  const lineaResumen = [
    `Medidas: ancho ${formatearCm(medidasAncho)} × altura ${formatearCm(medidasAlto)}`,
    `${resumen.total} ${resumen.total === 1 ? 'pieza' : 'piezas'}`,
    `${resumen.perfiles} ${resumen.perfiles === 1 ? 'perfil' : 'perfiles'} · ${formatearMl(resumen.metrosLineales)}`,
    `${resumen.vidrios} ${resumen.vidrios === 1 ? 'vidrio' : 'vidrios'} · ${formatearM2(resumen.vidrioM2)}`,
    `${resumen.herrajes} ${resumen.herrajes === 1 ? 'herraje' : 'herrajes'}`,
  ].join('   ·   ');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.4);
  pdf.setTextColor(35, 35, 38);
  pdf.text(lineaResumen, MARGEN, MARGEN + 19);

  pdf.setDrawColor(120, 122, 126);
  pdf.setLineWidth(0.3);
  pdf.line(MARGEN, MARGEN + 22, anchoPagina - MARGEN, MARGEN + 22);

  // ── Plano con cotas ─────────────────────────────────────────────────────
  // El margen superior e inferior reservan espacio para las dos líneas de cota
  // (tramos y total) sin invadir la cabecera ni el pie.
  const margenSup = MARGEN + 42;
  const margenInf = 30;
  const margenLateral = 24;
  const alturaDisponible = altoPagina - margenSup - margenInf;
  const anchoDisponible = anchoPagina - margenLateral * 2;
  const escala = Math.min(anchoDisponible / anchoObra, alturaDisponible / altoObra);
  const anchoPlanoMm = anchoObra * escala;
  const altoPlanoMm = altoObra * escala;
  const xInicio = (anchoPagina - anchoPlanoMm) / 2;
  const yInicio = margenSup + (alturaDisponible - altoPlanoMm) / 2;

  const mapearCm = (cm: number): number => xInicio + (cm - xMin) * escala;
  const mapearCmY = (cm: number): number => yInicio + (cm - yMin) * escala;

  // Guías desde el plano hasta las cotas.
  pdf.setDrawColor(170, 172, 176);
  pdf.setLineWidth(0.15);
  const cotaTop = yInicio - 10;
  const cotaBottom = yInicio + altoPlanoMm + 10;
  const cotaLeft = xInicio - 10;
  const cotaRight = xInicio + anchoPlanoMm + 10;
  pdf.line(xInicio, cotaTop, xInicio, yInicio);
  pdf.line(xInicio + anchoPlanoMm, cotaTop, xInicio + anchoPlanoMm, yInicio);
  pdf.line(xInicio, yInicio + altoPlanoMm, xInicio, cotaBottom);
  pdf.line(xInicio + anchoPlanoMm, yInicio + altoPlanoMm, xInicio + anchoPlanoMm, cotaBottom);
  pdf.line(cotaLeft, yInicio, xInicio, yInicio);
  pdf.line(cotaLeft, yInicio + altoPlanoMm, xInicio, yInicio + altoPlanoMm);
  pdf.line(xInicio + anchoPlanoMm, yInicio, cotaRight, yInicio);
  pdf.line(xInicio + anchoPlanoMm, yInicio + altoPlanoMm, cotaRight, yInicio + altoPlanoMm);

  // Piezas con su geometría real, en el orden recibido (selección aparte).
  const contextos = crearContextosPiezas(piezas, perfiles);
  piezas.forEach((pieza) => {
    const contexto = contextos.get(pieza.id);
    if (!contexto) return;
    dibujarPrimitivasPdf(
      pdf,
      construirElevacion(pieza, contexto),
      (cm) => mapearCm(pieza.x + cm),
      (cm) => mapearCmY(pieza.y + cm),
      escala,
    );
  });

  // Cotas: totales en el exterior y tramos interiores en el interior.
  const tramosAncho = tramosEje(piezas, 'ancho', xMin, xMax);
  const tramosAlto = tramosEje(piezas, 'alto', yMin, yMax);
  const totalAncho: Tramo[] = [{ inicio: xMin, fin: xMax }];
  const totalAlto: Tramo[] = [{ inicio: yMin, fin: yMax }];

  dibujarCotaPdf(pdf, true, tramosAncho, cotaTop, mapearCm, -2.2, 0.2, 5.8);
  dibujarCotaPdf(pdf, true, totalAncho, cotaTop - 6.5, mapearCm, -2.2, 0.35, 7.4);
  dibujarCotaPdf(pdf, true, tramosAncho, cotaBottom, mapearCm, 5.6, 0.2, 5.8);
  dibujarCotaPdf(pdf, true, totalAncho, cotaBottom + 6.5, mapearCm, 5.6, 0.35, 7.4);
  dibujarCotaPdf(pdf, false, tramosAlto, cotaLeft, mapearCmY, 3.4, 0.2, 5.8);
  dibujarCotaPdf(pdf, false, totalAlto, cotaLeft - 6.5, mapearCmY, 3.4, 0.35, 7.4);
  dibujarCotaPdf(pdf, false, tramosAlto, cotaRight, mapearCmY, 3.4, 0.2, 5.8);
  dibujarCotaPdf(pdf, false, totalAlto, cotaRight + 6.5, mapearCmY, 3.4, 0.35, 7.4);

  // Etiquetas numeradas de cada pieza (remiten a «Detalle por pieza»).
  dibujarEtiquetasPiezas(pdf, piezas, mapearCm, mapearCmY, escala);

  // Pieza seleccionada: cotas propias dentro del conjunto.
  if (piezaSeleccionada && piezaSeleccionada.orientacion !== 'punto') {
    const xr = mapearCm(piezaSeleccionada.x);
    const yr = mapearCmY(piezaSeleccionada.y);
    const anchoSel = piezaSeleccionada.anchoCm * escala;
    const altoSel = piezaSeleccionada.altoCm * escala;
    pdf.setDrawColor(46, 125, 50);
    pdf.setLineWidth(0.3);
    pdf.setLineDashPattern([1.2, 1.2], 0);
    pdf.rect(xr, yr, anchoSel, altoSel, 'S');
    pdf.setLineDashPattern([], 0);
    dibujarCotaPdf(
      pdf,
      true,
      [{ inicio: piezaSeleccionada.x, fin: piezaSeleccionada.x + piezaSeleccionada.anchoCm }],
      yr + altoSel + 5,
      mapearCm,
      4.8,
      0.3,
      6.4,
    );
    dibujarCotaPdf(
      pdf,
      false,
      [{ inicio: piezaSeleccionada.y, fin: piezaSeleccionada.y + piezaSeleccionada.altoCm }],
      xr + anchoSel + 5,
      mapearCmY,
      3.4,
      0.3,
      6.4,
    );
  }

  // Pie de la página del plano.
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 112, 116);
  pdf.text(
    'Cotas en centímetros. Los números remiten al «Detalle por pieza» de las páginas siguientes.',
    MARGEN,
    altoPagina - 6,
  );
  pdf.text('Generado con GlassView', anchoPagina - MARGEN, altoPagina - 6, { align: 'right' });

  // ── Páginas de detalle: tablas ──────────────────────────────────────────
  pdf.addPage('a4', 'portrait');
  const altoPaginaVertical = pdf.internal.pageSize.getHeight();
  const anchoTablas = pdf.internal.pageSize.getWidth() - MARGEN * 2;
  let y = MARGEN + 6;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(20, 20, 22);
  pdf.text(`Despiece — ${nombrePlano}`, MARGEN, y - 2);
  y += 4;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.6);
  pdf.setTextColor(90, 92, 96);
  pdf.text(
    `Medidas en centímetros · ancho ${formatearCm(medidasAncho)} × altura ${formatearCm(medidasAlto)}`,
    MARGEN,
    y,
  );
  y += 6;

  y = dibujarTabla(
    pdf,
    y,
    'Detalle por pieza',
    [
      { titulo: 'Nº', ancho: 9, alinear: 'center' },
      { titulo: 'REF', ancho: 22 },
      { titulo: 'Descripción', ancho: 52 },
      { titulo: 'Medidas en cm', ancho: 32 },
      { titulo: 'Esp.', ancho: 14, alinear: 'center' },
      { titulo: 'Cant. und.', ancho: 16, alinear: 'center' },
      { titulo: 'Posición (cm)', ancho: anchoTablas - 9 - 22 - 52 - 32 - 14 - 16 },
    ],
    piezas.map((pieza, indice) => [
      String(indice + 1),
      pieza.ref || '—',
      descripcionDe(pieza),
      medidaDe(pieza),
      esVidrio(pieza) ? `${pieza.espesorMm ?? 4} mm` : '—',
      String(pieza.cantidad || 1),
      posicionDe(pieza),
    ]),
  );

  // Despiece de perfiles con los grupos del taller: MARCO, HOJAS, etc.
  const columnasCortes: ColumnaTabla[] = [
    { titulo: 'REF', ancho: 24 },
    { titulo: 'Descripción', ancho: 64 },
    { titulo: 'Medidas en cm', ancho: 30, alinear: 'right' },
    { titulo: 'Cant. und.', ancho: 18, alinear: 'center' },
    { titulo: 'Cant. m.l', ancho: anchoTablas - 24 - 64 - 30 - 18, alinear: 'right' },
  ];
  cortesPorGrupo(piezas, perfiles).forEach((lineas, grupo) => {
    y = dibujarTabla(
      pdf,
      y,
      grupo,
      columnasCortes,
      lineas.map((corte) => [
        corte.ref || '—',
        corte.descripcion,
        numeroCota(corte.largoCm),
        String(corte.cantidad),
        formatearMl(corte.ml),
      ]),
    );
  });

  const vidrios = listaVidrios(piezas);
  y = dibujarTabla(
    pdf,
    y,
    'VIDRIOS',
    [
      { titulo: 'REF. vidrio', ancho: 30 },
      { titulo: 'Descripción', ancho: 52 },
      { titulo: 'Ancho (cm)', ancho: 24, alinear: 'right' },
      { titulo: 'Altura (cm)', ancho: 24, alinear: 'right' },
      { titulo: 'Cant. und.', ancho: 18, alinear: 'center' },
      { titulo: 'M2', ancho: anchoTablas - 30 - 52 - 24 - 24 - 18, alinear: 'right' },
    ],
    vidrios.map((vidrio) => [
      `${vidrio.espesorMm} mm`,
      vidrio.descripcion,
      numeroCota(vidrio.anchoCm),
      numeroCota(vidrio.altoCm),
      String(vidrio.cantidad),
      formatearM2(vidrio.m2),
    ]),
  );

  const herrajes = listaHerrajes(piezas, perfiles);
  y = dibujarTabla(
    pdf,
    y,
    'HERRAJES',
    [
      { titulo: 'REF', ancho: 28 },
      { titulo: 'Descripción', ancho: 118 },
      { titulo: 'Cant. und.', ancho: anchoTablas - 28 - 118, alinear: 'center' },
    ],
    herrajes.map((herraje) => [herraje.ref || '—', herraje.descripcion, String(herraje.cantidad)]),
  );

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(110, 112, 116);
  pdf.text('Generado con GlassView', MARGEN, altoPaginaVertical - 6);

  return pdf;
}

/** Genera y descarga el PDF del plano. */
export function exportarPlanoPdf(
  piezas: PiezaPlano[],
  piezaSeleccionada: PiezaPlano | null,
  nombrePlano: string,
  perfiles: PerfilVentaneria[] = [],
  opciones: OpcionesPdfPlano = {},
): void {
  const pdf = crearPlanoPdf(piezas, piezaSeleccionada, nombrePlano, perfiles, opciones);
  if (!pdf) return;
  const nombreArchivo = `plano-${nombrePlano.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  pdf.save(nombreArchivo);
}
