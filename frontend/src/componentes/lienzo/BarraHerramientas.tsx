import type { ModeloVentaneria } from '../../tipos';
import { HERRAMIENTAS } from '../../constantes';
import IconoHerramienta from './IconoHerramienta';

export interface BarraHerramientasProps {
  herramienta: string;
  barraExpandida: boolean;
  presetsAbierto: boolean;
  modelos: ModeloVentaneria[];
  onCambiarHerramienta: (herramienta: string) => void;
  onAlternarBarra: () => void;
  onAlternarPresets: () => void;
}

/** Barra lateral con las herramientas de dibujo y las plantillas de ventanas. */
export default function BarraHerramientas({
  herramienta,
  barraExpandida,
  presetsAbierto,
  modelos,
  onCambiarHerramienta,
  onAlternarBarra,
  onAlternarPresets,
}: BarraHerramientasProps): JSX.Element {
  const esPresetActivo = herramienta.startsWith('preset-');

  return (
    <div className={`barra-herramientas ${barraExpandida ? 'expandida' : ''}`}>
      <button
        type="button"
        className="barra-boton-expandir"
        onClick={onAlternarBarra}
        title={barraExpandida ? 'Contraer barra' : 'Expandir barra'}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
        <span className="herramienta-nombre barra-expandir-nombre">Barra de herramientas</span>
      </button>
      <span className="barra-herramientas-separador" />
      <div className="barra-presets">
        <button
          type="button"
          className={`herramienta-boton preset ${esPresetActivo || presetsAbierto ? 'activa' : ''}`}
          onClick={onAlternarPresets}
          title="Plantillas disponibles"
        >
          <span className="icono-herramienta">
            <IconoHerramienta id="plantillas" />
          </span>
          <span className="herramienta-nombre">Plantillas</span>
        </button>
        {presetsAbierto && (
          <div className="preset-lista">
            {modelos.map((modelo) => (
              <button
                key={modelo.id}
                type="button"
                className={`herramienta-boton preset-item ${
                  herramienta === `preset-${modelo.id}` ? 'activa' : ''
                }`}
                onClick={() => {
                  onCambiarHerramienta(`preset-${modelo.id}`);
                  onAlternarPresets();
                }}
                title={`Plantilla ${modelo.nombre}: arrastra en el lienzo para colocar las piezas`}
              >
                <span className="icono-herramienta">
                  <IconoHerramienta id={modelo.sistema === 'corredera' ? 'hoja' : 'vidrio'} />
                </span>
                <span className="herramienta-nombre">{modelo.nombre}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <span className="barra-herramientas-separador" />
      {HERRAMIENTAS.map((herramientaCad) => (
        <button
          key={herramientaCad.id}
          type="button"
          className={`herramienta-boton ${herramienta === herramientaCad.id ? 'activa' : ''}`}
          onClick={() => onCambiarHerramienta(herramientaCad.id)}
          title={herramientaCad.nombre}
        >
          <span className="icono-herramienta">
            <IconoHerramienta id={herramientaCad.id} />
          </span>
          <span className="herramienta-nombre">{herramientaCad.nombre}</span>
        </button>
      ))}
    </div>
  );
}