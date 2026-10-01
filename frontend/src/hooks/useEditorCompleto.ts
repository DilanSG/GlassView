import { useEffect, useState } from 'react';

/** En pantallas táctiles el editor de piezas se abre a pantalla completa. */
const CONSULTA_EDITOR_COMPLETO = '(pointer: coarse) and (max-width: 1024px)';

/**
 * Indica si la pieza se debe diseñar en un editor a pantalla completa: en
 * móviles y tablets el lienzo en línea queda demasiado pequeño para dibujar.
 */
export function useEditorCompleto(): boolean {
  const [editorCompleto, setEditorCompleto] = useState(
    () => window.matchMedia(CONSULTA_EDITOR_COMPLETO).matches,
  );

  useEffect(() => {
    const consulta = window.matchMedia(CONSULTA_EDITOR_COMPLETO);
    const manejarCambio = (evento: MediaQueryListEvent): void => setEditorCompleto(evento.matches);

    setEditorCompleto(consulta.matches);
    consulta.addEventListener('change', manejarCambio);
    return () => consulta.removeEventListener('change', manejarCambio);
  }, []);

  return editorCompleto;
}
