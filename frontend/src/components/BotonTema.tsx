import { useTema } from '../hooks/useTema';

const FICHA_ICONO = {
  viewBox: '0 0 24 24',
  width: 14,
  height: 14,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export default function BotonTema() {
  const { tema, alternarTema } = useTema();
  const esOscuro = tema === 'oscuro';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={esOscuro}
      className={`interruptor-tema ${esOscuro ? 'oscuro' : 'claro'}`}
      onClick={alternarTema}
      title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="interruptor-tema-carril">
        <svg className="interruptor-tema-icono interruptor-tema-icono-sol" {...FICHA_ICONO}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" />
        </svg>
        <svg className="interruptor-tema-icono interruptor-tema-icono-luna" {...FICHA_ICONO}>
          <path d="M19.5 14.3A7.6 7.6 0 0 1 9.7 4.5a7.6 7.6 0 1 0 9.8 9.8Z" />
        </svg>
        <span className="interruptor-tema-perilla" />
      </span>
    </button>
  );
}
