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
  etapaRef: RefObject<Konva.Stage>;
  contenedorRef: RefObject<HTMLDivElement>;
  aplicarZoom: (factor: number) => void;
  acercarAlejar: (evento: Konva.KonvaEventObject<WheelEvent>) => void;
  iniciarPan: (punto: PuntoPlano) => void;
  aplicarPan: (punto: PuntoPlano) => boolean;
  terminarPan: () => boolean;
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

  const etapaRef = useRef<Konva.Stage>(null);
  const contenedorRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef<PanPlano | null>(null);

  useEffect(() => {
    const contenedor = contenedorRef.current;
    if (!contenedor) return;
    const medir = (): void => {
      const ancho = contenedor.clientWidth;
      const alto = contenedor.clientHeight;
      if (ancho > 0 && alto > 0) setTamanoVista({ ancho, alto });
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
    const centroMundo = {
      x: (etapa.width() / 2 - vista.x) / vista.zoom,
      y: (etapa.height() / 2 - vista.y) / vista.zoom,
    };
    const siguiente = Math.min(
      ZOOM_MAX,
      Math.max(ZOOM_MIN, vista.zoom * factor),
    );
    setVista({
      zoom: siguiente,
      x: vista.x - centroMundo.x * (siguiente - vista.zoom),
      y: vista.y - centroMundo.y * (siguiente - vista.zoom),
    });
  }

  /** Rueda del ratón: aleja/acerca manteniendo fijo el punto bajo el cursor. */
  function acercarAlejar(evento: Konva.KonvaEventObject<WheelEvent>): void {
    evento.evt.preventDefault();
    const etapa = etapaRef.current;
    if (!etapa) return;
    const puntoPantalla = etapa.getRelativePointerPosition();
    if (!puntoPantalla) return;
    const puntoMundo = {
      x: (puntoPantalla.x - vista.x) / vista.zoom,
      y: (puntoPantalla.y - vista.y) / vista.zoom,
    };
    const anterior = vista.zoom;
    const factor = evento.evt.deltaY < 0 ? 1.1 : 1 / 1.1;
    const siguiente = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, anterior * factor));

    const x = vista.x - (puntoMundo.x * (siguiente - anterior));
    const y = vista.y - (puntoMundo.y * (siguiente - anterior));
    setVista({ zoom: siguiente, x, y });
  }

  /** Comienza un arrastre de la vista (herramienta «mano»). */
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
      x: pan.inicioX + (punto.x - pan.x) * actual.zoom,
      y: pan.inicioY + (punto.y - pan.y) * actual.zoom,
    }));
    return true;
  }

  /** Termina el arrastre de la vista; devuelve true si había pan activo. */
  function terminarPan(): boolean {
    if (!panRef.current) return false;
    panRef.current = null;
    return true;
  }

  return {
    vista,
    tamanoVista,
    etapaRef,
    contenedorRef,
    aplicarZoom,
    acercarAlejar,
    iniciarPan,
    aplicarPan,
    terminarPan,
  };
}