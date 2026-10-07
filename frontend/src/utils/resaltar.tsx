import type { ReactNode } from 'react';

/**
 * Convierte los tramos escritos entre «guiones angulares» en texto resaltado,
 * para que no se vean los signos en la interfaz.
 */
export function resaltar(texto: string, clave = 'resalte'): ReactNode[] {
  return texto.split(/«([^»]+)»/g).map((parte, posicion) =>
    posicion % 2 === 1 ? (
      <strong key={`${clave}-${posicion}`} className="texto-resalte">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}
