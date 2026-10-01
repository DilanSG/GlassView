import type { ReactNode } from 'react';

export interface AvisoOrientacionProps {
  /** Intenta poner la app a pantalla completa, lo que suele permitir el bloqueo en horizontal. */
  onIntentarHorizontal: () => void;
  /** Explica por qué el editor necesita la pantalla en horizontal. */
  mensaje?: string;
  /** Título del aviso. */
  titulo?: string;
  /** Vista previa del contenido que se está editando (plano o pieza). */
  preview?: ReactNode;
}

/**
 * Pantalla que se muestra en vertical cuando el editor necesita el ancho del
 * móvil en horizontal: usa el fondo decorativo de la web, presenta la marca y
 * enseña una vista previa del contenido para no perder el contexto.
 */
export default function AvisoOrientacion({
  onIntentarHorizontal,
  mensaje = 'El editor de planos aprovecha todo el ancho de la pantalla en horizontal. Gira el dispositivo para continuar.',
  titulo = 'Pantalla en horizontal',
  preview,
}: AvisoOrientacionProps): JSX.Element {
  return (
    <div className="aviso-orientacion" role="alertdialog" aria-label="Gira el dispositivo">
      <div className="aviso-orientacion-contenido">
        {preview && (
          <div className="aviso-orientacion-preview" aria-hidden="true">
            {preview}
          </div>
        )}

        <h2>{titulo}</h2>
        <p>{mensaje}</p>

        <button type="button" className="boton-primario" onClick={onIntentarHorizontal}>
          Activar pantalla completa
        </button>
      </div>
    </div>
  );
}
