export interface ControlesZoomProps {
  aplicarZoom: (factor: number) => void;
  enPantallaCompleta: boolean;
  onAbrirPantallaCompleta?: () => void;
  onExportarPdf: () => void;
}

const FICHA_ZOOM = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const FICHA_PDF = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Botones flotantes del lienzo: acercar, alejar, pantalla completa y PDF. */
export default function ControlesZoom({
  aplicarZoom,
  enPantallaCompleta,
  onAbrirPantallaCompleta,
  onExportarPdf,
}: ControlesZoomProps): JSX.Element {
  return (
    <div className="controles-lienzo">
      <button
        type="button"
        className="boton-zoom"
        onClick={() => aplicarZoom(1.2)}
        title="Acercar"
      >
        <span className="icono-herramienta">
          <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_ZOOM}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
            <path d="M11 8v6M8 11h6" />
          </svg>
        </span>
      </button>
      <button
        type="button"
        className="boton-zoom"
        onClick={() => aplicarZoom(1 / 1.2)}
        title="Alejar"
      >
        <span className="icono-herramienta">
          <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_ZOOM}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
            <path d="M8 11h6" />
          </svg>
        </span>
      </button>
      {!enPantallaCompleta && onAbrirPantallaCompleta && (
        <button
          type="button"
          className="boton-pantalla-completa"
          onClick={onAbrirPantallaCompleta}
          title="Abrir plano en pantalla completa"
        >
          <span className="icono-herramienta">
            <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_PDF}>
              <path d="M4 9V4h5" />
              <path d="M20 9V4h-5" />
              <path d="M4 15v5h5" />
              <path d="M20 15v5h-5" />
            </svg>
          </span>
        </button>
      )}
      <button
        type="button"
        className="boton-zoom"
        onClick={onExportarPdf}
        title="Descargar plano en PDF"
      >
        <span className="icono-herramienta">
          <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_PDF}>
            <path d="M12 3v12" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
        </span>
      </button>
    </div>
  );
}