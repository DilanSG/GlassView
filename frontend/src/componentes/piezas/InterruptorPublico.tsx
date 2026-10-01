export interface InterruptorPublicoProps {
  activo: boolean;
  onCambiar: (activo: boolean) => void;
}

const FICHA = {
  viewBox: '0 0 24 24',
  width: 14,
  height: 14,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

/** Interruptor de visibilidad de la pieza, con el estilo del cambio de tema. */
export default function InterruptorPublico({ activo, onCambiar }: InterruptorPublicoProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      className={`interruptor-publico ${activo ? 'activo' : ''}`}
      onClick={() => onCambiar(!activo)}
      title={activo ? 'Pieza pública: la ve la comunidad' : 'Pieza privada: solo la ves tú'}
    >
      <span className="interruptor-publico-carril">
        <svg className="interruptor-publico-icono interruptor-publico-icono-no" {...FICHA}>
          <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
        </svg>
        <svg className="interruptor-publico-icono interruptor-publico-icono-si" {...FICHA}>
          <path d="m5.5 12.5 4.2 4.2 8.8-9.4" />
        </svg>
        <span className="interruptor-publico-perilla" />
      </span>
      <span className="interruptor-publico-texto">{activo ? 'Pública' : 'Privada'}</span>
    </button>
  );
}
