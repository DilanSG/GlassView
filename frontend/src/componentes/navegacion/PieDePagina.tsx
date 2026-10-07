interface PieDePaginaProps {
  /** Si se indica, muestra el acceso al selector de tutoriales. */
  onAbrirTutorial?: () => void;
}

export default function PieDePagina({ onAbrirTutorial }: PieDePaginaProps) {
  return (
    <footer className="pie-pagina">
      <div className="pie-pagina-info">
        <p className="pie-pagina-marca">
          GlassView © 2026 <span className="pie-pagina-punto">·</span>{' '}
          <span className="marca-into-code">IntoCode</span>
        </p>
        <p className="pie-pagina-creditos">Desarrollado por Axl Anzola y Dilan Acuña</p>
      </div>

      {onAbrirTutorial && (
        <button
          type="button"
          className="pie-pagina-tutorial"
          onClick={onAbrirTutorial}
          aria-label="Abrir los tutoriales de GlassView"
          title="Tutoriales"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 7.9h.01" />
          </svg>
          <span>Tutoriales</span>
        </button>
      )}
    </footer>
  );
}
