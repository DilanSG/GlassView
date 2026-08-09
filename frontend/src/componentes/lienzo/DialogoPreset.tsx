import type { ModeloVentaneria } from '../../tipos';

export interface DialogoPresetProps {
  modelo: ModeloVentaneria | undefined;
  anchoPreset: string;
  altoPreset: string;
  insertando: boolean;
  onCambiarAncho: (valor: string) => void;
  onCambiarAlto: (valor: string) => void;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/** Diálogo para colocar una plantilla de ventana con medidas reales. */
export default function DialogoPreset({
  modelo,
  anchoPreset,
  altoPreset,
  insertando,
  onCambiarAncho,
  onCambiarAlto,
  onCancelar,
  onConfirmar,
}: DialogoPresetProps): JSX.Element {
  return (
    <div className="preset-dialog">
      <div className="selector-ref-cabecera">
        <strong>Plantilla · medidas reales</strong>
        <button type="button" className="boton-eliminar" onClick={onCancelar} disabled={insertando}>
          Cancelar
        </button>
      </div>
      <p className="preset-dialog-ayuda">
        La plantilla se coloca con las medidas reales de la ventana; no se puede arrastrar para
        cambiar su tamaño.
      </p>
      <div className="preset-dialog-campos">
        <label className="medidor-campo">
          Ancho
          <input
            autoFocus
            type="number"
            min="10"
            step="1"
            value={anchoPreset}
            onChange={(evento) => onCambiarAncho(evento.target.value)}
          />
          cm
        </label>
        <label className="medidor-campo">
          Alto
          <input
            type="number"
            min="10"
            step="1"
            value={altoPreset}
            onChange={(evento) => onCambiarAlto(evento.target.value)}
          />
          cm
        </label>
      </div>
      {modelo && (
        <p className="preset-dialog-ayuda">
          Medida de ejemplo del modelo: {modelo.ejemplo.ancho} × {modelo.ejemplo.alto} cm
        </p>
      )}
      <button
        type="button"
        className="boton-primario"
        onClick={onConfirmar}
        disabled={insertando}
      >
        {insertando ? 'Colocando...' : 'Colocar plantilla'}
      </button>
    </div>
  );
}