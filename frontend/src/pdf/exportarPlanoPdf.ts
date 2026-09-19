import { jsPDF } from 'jspdf';
import type { PerfilVentaneria, PiezaPlano } from '../tipos';
import { crearContextosPiezas } from '../piezas/contexto';
import { construirElevacion } from '../piezas/elevacion';
import type { Primitiva, TonoPieza } from '../piezas/tipos';

interface Tramo {
  inicio: number;
  fin: number;
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
    // Divisiones a menos de 1.5 cm de la anterior se descartan: dos cotas
    // seguidas tan juntas quedarían solapadas.
    if (seleccionadas.length === 0 || division - seleccionadas[seleccionadas.length - 1] > 1.5) {
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
  tramosPortal: number[],
  desplazamientoEtiqueta: number,
  mapearCm: (cm: number) => number,
): void {
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.35);
  const ini = tramosPortal[0];
  const fin = tramosPortal[tramosPortal.length - 1];
  if (horizontal) {
    pdf.line(ini, posicionLinea, fin, posicionLinea);
  } else {
    pdf.line(posicionLinea, ini, posicionLinea, fin);
  }

  tramosPortal.forEach((punto) => {
    if (horizontal) {
      pdf.line(punto, posicionLinea - 1.2, punto, posicionLinea + 1.2);
    } else {
      pdf.line(posicionLinea - 1.2, punto, posicionLinea + 1.2, punto);
    }
  });

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(0, 0, 0);
  tramos.forEach((tramo) => {
    const inicio = mapearCm(tramo.inicio);
    const fin = mapearCm(tramo.fin);
    const medio = (inicio + fin) / 2;
    const texto = `${Math.round((tramo.fin - tramo.inicio) * 10) / 10} cm`;
    if (horizontal) {
      pdf.text(texto, medio, posicionLinea + desplazamientoEtiqueta, { align: 'center' });
    } else {
      pdf.text(texto, posicionLinea + desplazamientoEtiqueta, medio, { align: 'center', angle: 90 });
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
    if (primitiva.tono) {
      const color = PALETA_PDF[primitiva.tono];
      pdf.setDrawColor(color[0], color[1], color[2]);
    }
    const relleno = 'relleno' in primitiva ? primitiva.relleno : undefined;
    if (relleno) {
      const color = PALETA_PDF[relleno];
      pdf.setFillColor(color[0], color[1], color[2]);
    }
    pdf.setLineWidth(grosor);
    if (primitiva.trazo === 'discontinua') {
      pdf.setLineDashPattern([Math.max(0.4, grosor * 4), Math.max(0.3, grosor * 3)], 0);
    } else {
      pdf.setLineDashPattern([], 0);
    }

    switch (primitiva.tipo) {
      case 'linea':
        if (primitiva.tono) {
          pdf.line(
            mapearX(primitiva.x1),
            mapearY(primitiva.y1),
            mapearX(primitiva.x2),
            mapearY(primitiva.y2),
          );
        }
        break;
      case 'rect': {
        const estilo = `${relleno ? 'F' : ''}${primitiva.tono ? 'D' : ''}` || 'S';
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
        const estilo = `${relleno ? 'F' : ''}${primitiva.tono ? 'D' : ''}` || 'S';
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
        const estilo = `${relleno ? 'F' : ''}${primitiva.tono ? 'D' : ''}` || 'S';
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
          if (anterior && primitiva.tono) {
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

/**
 * Genera y descarga un PDF del plano con cotas en los cuatro lados.
 * Las piezas se dibujan con su geometría real (perfiles, vidrios y herrajes).
 * Si hay una pieza seleccionada, las cotas se centran en esa pieza.
 */
export function exportarPlanoPdf(
  piezas: PiezaPlano[],
  piezaSeleccionada: PiezaPlano | null,
  nombrePlano: string,
  perfiles: PerfilVentaneria[] = [],
): void {
  const rectangulos = piezas.filter(
    (pieza) => pieza.orientacion !== 'punto' && pieza.anchoCm > 0 && pieza.altoCm > 0,
  );
  if (rectangulos.length === 0) return;

  const xMin = Math.min(...rectangulos.map((p) => p.x));
  const xMax = Math.max(...rectangulos.map((p) => p.x + p.anchoCm));
  const yMin = Math.min(...rectangulos.map((p) => p.y));
  const yMax = Math.max(...rectangulos.map((p) => p.y + p.altoCm));

  const esHorizontal = xMax - xMin >= yMax - yMin;
  const pdf = new jsPDF({
    orientation: esHorizontal ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const anchoPagina = pdf.internal.pageSize.getWidth();
  const altoPagina = pdf.internal.pageSize.getHeight();

  const margenSup = 70;
  const margenInf = 15;
  const margenLateral = 22;
  const alturaDisponible = altoPagina - margenSup - margenInf;
  const anchoDisponible = anchoPagina - margenLateral * 2;
  const escala = Math.min(
    anchoDisponible / (xMax - xMin),
    alturaDisponible / (yMax - yMin),
  );
  const anchoPlanoMm = (xMax - xMin) * escala;
  const altoPlanoMm = (yMax - yMin) * escala;
  const xInicio = (anchoPagina - anchoPlanoMm) / 2;
  const yInicio = margenSup + (alturaDisponible - altoPlanoMm) / 2;

  const mapearCm = (cm: number): number => xInicio + (cm - xMin) * escala;
  const mapearCmY = (cm: number): number => yInicio + (cm - yMin) * escala;

  pdf.setFillColor(255, 255, 255);
  pdf.rect(0, 0, anchoPagina, altoPagina, 'F');

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

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(0, 0, 0);
  pdf.text(`Plano de instalación — ${nombrePlano}`, 8, margenSup - 21);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  const piezaFoco =
    piezaSeleccionada && piezaSeleccionada.orientacion !== 'punto'
      ? piezaSeleccionada
      : null;
  pdf.text(
    piezaFoco
      ? `Pieza seleccionada · ${Math.round(piezaFoco.anchoCm * 10) / 10} × ${Math.round(piezaFoco.altoCm * 10) / 10} cm · ${piezaFoco.tipo}`
      : `Ancho total ${Math.round((xMax - xMin) * 10) / 10} cm  ·  Alto total ${Math.round((yMax - yMin) * 10) / 10} cm`,
    8,
    margenSup - 13,
  );

  const cotaTop = yInicio - 9;
  const cotaBottom = yInicio + altoPlanoMm + 9;
  const cotaLeft = xInicio - 9;
  const cotaRight = xInicio + anchoPlanoMm + 9;

  const tramosAncho = piezaFoco
    ? [{ inicio: 0, fin: Math.max(0, piezaFoco.anchoCm) }]
    : tramosEje(piezas, 'ancho', xMin, xMax);
  const tramosAlto = piezaFoco
    ? [{ inicio: 0, fin: Math.max(0, piezaFoco.altoCm) }]
    : tramosEje(piezas, 'alto', yMin, yMax);

  const mapearCotaCm = piezaFoco
    ? (cm: number): number => xInicio + (piezaFoco.x - xMin + cm) * escala
    : mapearCm;
  const mapearCotaCmY = piezaFoco
    ? (cm: number): number => yInicio + (piezaFoco.y - yMin + cm) * escala
    : mapearCmY;

  const portalAncho = tramosAncho.flatMap((t) => [mapearCotaCm(t.inicio), mapearCotaCm(t.fin)]);
  const portalAlto = tramosAlto.flatMap((t) => [mapearCotaCmY(t.inicio), mapearCotaCmY(t.fin)]);

  if (piezaFoco) {
    const xr = mapearCotaCm(0);
    const yr = mapearCotaCmY(0);

    dibujarCotaPdf(pdf, true, tramosAncho, yr - 4, portalAncho, -2, mapearCotaCm);
    dibujarCotaPdf(pdf, true, tramosAncho, yr + piezaFoco.altoCm * escala + 4, portalAncho, 5, mapearCotaCm);
    dibujarCotaPdf(pdf, false, tramosAlto, xr - 4, portalAlto, 3, mapearCotaCmY);
    dibujarCotaPdf(pdf, false, tramosAlto, xr + piezaFoco.anchoCm * escala + 4, portalAlto, 3, mapearCotaCmY);
  } else {
    dibujarCotaPdf(pdf, true, tramosAncho, cotaTop, portalAncho, -2, mapearCm);
    dibujarCotaPdf(pdf, true, tramosAncho, cotaBottom, portalAncho, 9, mapearCm);
    dibujarCotaPdf(pdf, false, tramosAlto, cotaLeft, portalAlto, 3, mapearCmY);
    dibujarCotaPdf(pdf, false, tramosAlto, cotaRight, portalAlto, 3, mapearCmY);
  }

  const nombreArchivo = `plano-${nombrePlano.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  pdf.save(nombreArchivo);
}
