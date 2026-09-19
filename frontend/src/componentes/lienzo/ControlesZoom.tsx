export interface ControlesZoomProps {
  aplicarZoom: (factor: number) => void;
  enPantallaCompleta: boolean;
  onAbrirPantallaCompleta?: () => void;
  /** Ajusta el zoom para que todo el plano quepa en pantalla. */
  onEncuadrar?: () => void;
}

const FICHA_ZOOM = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const FICHA_PANTALLA = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/** Botones flotantes del lienzo: pantalla completa, acercar, alejar y encuadrar. */
export default function ControlesZoom({
  aplicarZoom,
  enPantallaCompleta,
  onAbrirPantallaCompleta,
  onEncuadrar,
}: ControlesZoomProps): JSX.Element {
  return (
    <div className="controles-lienzo">
      {onAbrirPantallaCompleta && (
        <button
          type="button"
          className="boton-pantalla-completa"
          onClick={onAbrirPantallaCompleta}
          title={
            enPantallaCompleta
              ? 'Salir de pantalla completa'
              : 'Abrir plano en pantalla completa'
          }
        >
          <span className="icono-herramienta">
            {enPantallaCompleta ? (
              <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_PANTALLA}>
                <path d="M9 4v5H4" />
                <path d="M15 4v5h5" />
                <path d="M9 20v-5H4" />
                <path d="M15 20v-5h5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_PANTALLA}>
                <path d="M4 9V4h5" />
                <path d="M20 9V4h-5" />
                <path d="M4 15v5h5" />
                <path d="M20 15v5h-5" />
              </svg>
            )}
          </span>
        </button>
      )}
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
      {onEncuadrar && (
        <button
          type="button"
          className="boton-zoom"
          onClick={onEncuadrar}
          title="Encuadrar el plano en pantalla"
        >
          <span className="icono-herramienta">
            <svg viewBox="0 0 24 24" width="18" height="18" {...FICHA_ZOOM}>
              <path d="M4 8V5a1 1 0 0 1 1-1h3" />
              <path d="M16 4h3a1 1 0 0 1 1 1v3" />
              <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
              <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
