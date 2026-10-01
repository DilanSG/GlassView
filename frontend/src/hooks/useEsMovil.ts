import { useEffect, useState } from 'react';

/** Ancho máximo en el que la barra de navegación usa el menú compacto. */
const CONSULTA_MOVIL = '(max-width: 860px)';

/**
 * Indica si la ventana está en tamaño móvil y reacciona cuando cambia el
 * tamaño o la orientación de la pantalla.
 */
export function useEsMovil(): boolean {
  const [esMovil, setEsMovil] = useState(() => window.matchMedia(CONSULTA_MOVIL).matches);

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_MOVIL);
    const manejarCambio = (evento: MediaQueryListEvent): void => setEsMovil(evento.matches);

    setEsMovil(consulta.matches);
    consulta.addEventListener('change', manejarCambio);
    return () => consulta.removeEventListener('change', manejarCambio);
  }, []);

  return esMovil;
}
