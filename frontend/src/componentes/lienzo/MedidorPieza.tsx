import type { CSSProperties } from 'react';
import type { PiezaPlano } from '../../tipos';
import { valorCm } from '../../utils/geometria';
import { PX_POR_CM } from '../../constantes';
import type { VistaPlano } from '../../hooks/useZoomPan';

export interface MedidorPiezaProps {
  pieza: PiezaPlano;
  vista: VistaPlano;
  onSeleccionarPieza: (id: string | null) => void;
  onMedir: (cambios: Partial<PiezaPlano>) => void;
  onCerrar: () => void;
}

/** Panel flotante con los campos de medida de la pieza seleccionada. */
export default function MedidorPieza({
  pieza,
  vista,
  onSeleccionarPieza,
  onMedir,
  onCerrar,
}: MedidorPiezaProps): JSX.Element {
  const { orientacion, tipo, anchoCm, altoCm } = pieza;
  const esPunto = orientacion === 'punto';
  const esVidrio = tipo === 'vidrio' || tipo === 'acrilico';

  const aplicarLargo = (texto: string): void => {
    const valor = valorCm(texto);
    if (valor === null) return;
    if (orientacion === 'horizontal') {
      onMedir({ anchoCm: valor, largoCm: valor });
    } else {
      onMedir({ altoCm: valor, largoCm: valor });
    }
  };
  const aplicarGrosor = (texto: string): void => {
    const valor = valorCm(texto);
    if (valor === null) return;
    if (orientacion === 'horizontal') {
      onMedir({ altoCm: valor });
    } else {
      onMedir({ anchoCm: valor });
    }
  };
  const aplicarAncho = (texto: string): void => {
    const valor = valorCm(texto);
    if (valor !== null) onMedir({ anchoCm: valor });
  };
  const aplicarAlto = (texto: string): void => {
    const valor = valorCm(texto);
    if (valor !== null) onMedir({ altoCm: valor });
  };

  const campos = (): JSX.Element => {
    if (esPunto) {
      return <p className="medidor-tipo">Pieza puntual: solo posición y cantidad.</p>;
    }
    if (esVidrio) {
      return (
        <div className="medidor-campos">
          <label className="medidor-campo">
            Ancho
            <input
              key={`vidrio-ancho-${pieza.id}`}
              type="number"
              min="0.1"
              step="0.1"
              defaultValue={anchoCm}
              onChange={(evento) => aplicarAncho(evento.target.value)}
            />
            cm
          </label>
          <label className="medidor-campo">
            Alto
            <input
              key={`vidrio-alto-${pieza.id}`}
              type="number"
              min="0.1"
              step="0.1"
              defaultValue={altoCm}
              onChange={(evento) => aplicarAlto(evento.target.value)}
            />
            cm
          </label>
        </div>
      );
    }
    const largoActual = orientacion === 'horizontal' ? anchoCm : altoCm;
    const grosorActual = orientacion === 'horizontal' ? altoCm : anchoCm;
    return (
      <div className="medidor-campos">
        <label className="medidor-campo">
          Largo
          <input
            key={`largo-${pieza.id}`}
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={largoActual}
            onChange={(evento) => aplicarLargo(evento.target.value)}
          />
          cm
        </label>
        <label className="medidor-campo">
          Grosor
          <input
            key={`grosor-${pieza.id}`}
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={grosorActual}
            onChange={(evento) => aplicarGrosor(evento.target.value)}
          />
          cm
        </label>
      </div>
    );
  };

  return (
    <div
      className="medidor-pieza"
      style={
        {
          '--x': `${Math.max(
            0,
            vista.x + (pieza.x + pieza.anchoCm) * PX_POR_CM * vista.zoom,
          )}px`,
          '--y': `${Math.max(0, vista.y + pieza.y * PX_POR_CM * vista.zoom)}px`,
        } as CSSProperties
      }
    >
      <div className="medidor-cabecera">
        <span className="medidor-nombre">
          {pieza.descripcion || pieza.ref || pieza.tipo}
        </span>
        {pieza.ref && <span className="medidor-ref">{pieza.ref}</span>}
        <button
          type="button"
          className="medidor-cerrar"
          title="Quitar selección"
          onClick={() => {
            onSeleccionarPieza(null);
            onCerrar();
          }}
        >
          ×
        </button>
      </div>
      {campos()}
    </div>
  );
}