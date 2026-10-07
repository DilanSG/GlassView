import { useEffect } from 'react';
import IconoCaracteristica from '../comunes/IconoCaracteristica';
import { OPCIONES_TUTORIAL, type GrupoTutorial } from './pasosTutorial';

interface SelectorTutorialProps {
  abierto: boolean;
  /** Mientras se consultan los proyectos de la cuenta. */
  cargando: boolean;
  /** Indica si la cuenta tiene proyectos creados. */
  hayProyectos: boolean;
  onElegir: (grupo: GrupoTutorial) => void;
  onCerrar: () => void;
}

/**
 * Selector de recorridos del tutorial. Se abre desde el icono de información
 * del pie de página y adapta la opción del plano a los proyectos existentes.
 */
export default function SelectorTutorial({
  abierto,
  cargando,
  hayProyectos,
  onElegir,
  onCerrar,
}: SelectorTutorialProps): JSX.Element | null {
  useEffect(() => {
    if (!abierto) {
      return;
    }
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') {
        onCerrar();
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, onCerrar]);

  if (!abierto) {
    return null;
  }

  return (
    <div
      className="selector-tutorial-fondo"
      role="dialog"
      aria-modal="true"
      aria-label="Tutoriales de GlassView"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) {
          onCerrar();
        }
      }}
    >
      <div className="selector-tutorial">
        <header className="selector-tutorial-cabecera">
          <h2 className="selector-tutorial-titulo">Tutoriales disponibles</h2>
          <button
            type="button"
            className="selector-tutorial-cerrar"
            aria-label="Cerrar"
            title="Cerrar"
            onClick={onCerrar}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
            </svg>
          </button>
        </header>

        <p className="selector-tutorial-intro">
          Selecciona la zona que quieras repasar. Cada recorrido explica únicamente esa parte de la
          aplicación.
        </p>

        <ul className="selector-tutorial-lista">
          {OPCIONES_TUTORIAL.map((opcion) => {
            const requiereProyecto = opcion.grupo === 'plano';
            const deshabilitada = requiereProyecto && !hayProyectos;
            const descripcion = deshabilitada
              ? cargando
                ? 'Consultando los proyectos de la cuenta…'
                : 'Requiere al menos un proyecto creado.'
              : opcion.texto;

            return (
              <li key={opcion.grupo}>
                <button
                  type="button"
                  className="selector-tutorial-opcion"
                  disabled={deshabilitada}
                  onClick={() => onElegir(opcion.grupo)}
                >
                  <span className="selector-tutorial-icono">
                    {opcion.icono === 'logo' ? (
                      <img src="/icono.png" alt="" />
                    ) : (
                      <IconoCaracteristica nombre={opcion.icono} />
                    )}
                  </span>
                  <span className="selector-tutorial-datos">
                    <strong>{opcion.titulo}</strong>
                    <span>{descripcion}</span>
                  </span>
                  <svg
                    className="selector-tutorial-flecha"
                    viewBox="0 0 24 24"
                    width="16"
                    height="16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
