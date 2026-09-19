import { useEffect, useRef, useState, type RefObject } from 'react';
import type Konva from 'konva';
import { ZOOM_MAX, ZOOM_MIN } from '../constantes';

export interface VistaPlano {
  zoom: number;
  x: number;
  y: number;
}

interface PanPlano {
  x: number;
  y: number;
  inicioX: number;
  inicioY: number;
}

export interface UseZoomPanResultado {
  vista: VistaPlano;
  tamanoVista: { ancho: number; alto: number };
  /** true cuando el tamaño del contenedor ya se midió de verdad. */
  tamanoMedido: boolean;
  etapaRef: RefObject<Konva.Stage>;
  contenedorRef: RefObject<HTMLDivElement>;
  aplicarZoom: (factor: number) => void;
  acercarAlejar: (evento: Konva.KonvaEventObject<WheelEvent>) => void;
  iniciarPan: (punto: PuntoPlano) => void;
  aplicarPan: (punto: PuntoPlano) => boolean;
  terminarPan: () => boolean;
  /** Ajusta la vista para mostrar todo el contenido en el lienzo. */
  encuadrar: (rango: { x: number; y: number; ancho: number; alto: number } | null) => void;
}

export interface PuntoPlano {
  x: number;
  y: number;
}

/**
 * Estado de la vista del lienzo: zoom, desplazamiento y tamaño del contenedor.
 * Agrupa la rueda del ratón, los botones +/− y la herramienta «mano».
 */
export function useZoomPan(): UseZoomPanResultado {
  const [vista, setVista] = useState<VistaPlano>({ zoom: 1, x: 0, y: 0 });
  const [tamanoVista, setTamanoVista] = useState({ ancho: 1280, alto: 720 });
  const [tamanoMedido, setTamanoMedido] = useState(false);

  const etapaRef = useRef<Konva.Stage>(null);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<PanPlano | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    const medir = (): void => {
      // Enteros hacia abajo y sin repetir el mismo tamaño: evita bucles de
      // redimensionado entre el Stage y su contenedor (parpadeo de scrollbars).
      const ancho = Math.floor(contenedor.clientWidth);
      const alto = Math.floor(contenedor.clientHeight);
      if (ancho <= 0 || alto <= 0) return;
      setTamanoVista((actual) =>
        actual.ancho === ancho && actual.alto === alto ? actual : { ancho, alto },
      );
      setTamanoMedido(true);
    };
    medir();
    const observador = new ResizeObserver(medir);
    observador.observe(contenedor);
    return () => observador.disconnect();
  }, []);

  /** Aplica un factor de zoom manteniendo el centro de la pantalla fijo. */
  function aplicarZoom(factor: number): void {
    const etapa = etapaRef.current;
    if (!etapa) return;
    setVista((actual) => {
      const centroMundo = {
        x: (etapa.width() / 2 - actual.x) / actual.zoom,
        y: (etapa.height() / 2 - actual.y) / actual.zoom,
      };
      const siguiente = Math.min(
        ZOOM_MAX,
        Math.max(ZOOM_MIN, actual.zoom * factor),
      );
      return {
        zoom: siguiente,
        x: actual.x - centroMundo.x * (siguiente - actual.zoom),
        y: actual.y - centroMundo.y * (siguiente - actual.zoom),
      };
    });
  }

  /** Rueda del ratón: aleja/acerca manteniendo fijo el punto bajo el cursor. */
  function acercarAlejar(evento: Konva.KonvaEventObject<WheelEvent>): void {
    evento.evt.preventDefault();
    const etapa = etapaRef.current;
    if (!etapa) return;
    const puntoPantalla = etapa.getRelativePointerPosition();
    if (!puntoPantalla) return;
    setVista((actual) => {
      const puntoMundo = {
        x: (puntoPantalla.x - actual.x) / actual.zoom,
        y: (puntoPantalla.y - actual.y) / actual.zoom,
      };
      const anterior = actual.zoom;
      const factor = evento.evt.deltaY < 0 ? 1.1 : 1 / 1.1;
      const siguiente = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, anterior * factor));
      return {
        zoom: siguiente,
        x: actual.x - puntoMundo.x * (siguiente - anterior),
        y: actual.y - puntoMundo.y * (siguiente - anterior),
      };
    });
  }

  /**
   * Comienza un arrastre de la vista (herramienta «mano»). El punto se recibe
   * en coordenadas de pantalla para que el desplazamiento sea 1:1 con el
   * cursor y no se realimente con el propio movimiento de la vista.
   */
  function iniciarPan(punto: PuntoPlano): void {
    panRef.current = {
      x: punto.x,
      y: punto.y,
      inicioX: vista.x,
      inicioY: vista.y,
    };
  }

  /** Desplaza la vista según el arrastre; devuelve true si hay pan activo. */
  function aplicarPan(punto: PuntoPlano): boolean {
    const pan = panRef.current;
    if (!pan) return false;
    setVista((actual) => ({
      ...actual,
      x: pan.inicioX + (punto.x - pan.x),
      y: pan.inicioY + (punto.y - pan.y),
    }));
    return true;
  }

  /** Termina el arrastre de la vista; devuelve true si había pan activo. */
  function terminarPan(): boolean {
    if (!panRef.current) return false;
    panRef.current = null;
    return true;
  }

  /** Centra y escala la vista para que todo el contenido quepa en pantalla. */
  function encuadrar(rango: { x: number; y: number; ancho: number; alto: number } | null): void {
    const etapa = etapaRef.current;
    if (!etapa || !rango || rango.ancho <= 0 || rango.alto <= 0) return;
    const margen = 48;
    const zoom = Math.min(
      ZOOM_MAX,
      Math.max(
        ZOOM_MIN,
        Math.min(
          (etapa.width() - margen * 2) / rango.ancho,
          (etapa.height() - margen * 2) / rango.alto,
        ),
      ),
    );
    setVista({
      zoom,
      x: (etapa.width() - rango.ancho * zoom) / 2 - rango.x * zoom,
      y: (etapa.height() - rango.alto * zoom) / 2 - rango.y * zoom,
    });
  }

  return {
    vista,
    tamanoVista,
    tamanoMedido,
    etapaRef,
    contenedorRef,
    aplicarZoom,
    acercarAlejar,
    iniciarPan,
    aplicarPan,
    terminarPan,
    encuadrar,
  };
}