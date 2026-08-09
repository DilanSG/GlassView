import { useTema } from '../hooks/useTema';

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
        <span className="interruptor-tema-icono interruptor-tema-icono-sol">☀️</span>
        <span className="interruptor-tema-icono interruptor-tema-icono-luna">🌙</span>
        <span className="interruptor-tema-perilla" />
      </span>
    </button>
  );
}
