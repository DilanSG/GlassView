import { useMemo, type CSSProperties } from 'react';
import type { PerfilVentaneria, PiezaPlano } from '../../tipos';
import { valorCm } from '../../utils/geometria';
import { PX_POR_CM } from '../../constantes';
import type { VistaPlano } from '../../hooks/useZoomPan';
import { crearContextosPiezas } from '../../piezas/contexto';
import { ETIQUETA_CLASE } from '../../piezas/resolver';
import SeccionPieza from '../../piezas/SeccionPieza';

export interface MedidorPiezaProps {
  pieza: PiezaPlano;
  perfiles: PerfilVentaneria[];
  vista: VistaPlano;
  onSeleccionarPieza: (id: string | null) => void;
  onMedir: (cambios: Partial<PiezaPlano>) => void;
  onCerrar: () => void;
}

/** Panel flotante con los campos de medida y la sección de la pieza. */
export default function MedidorPieza({
  pieza,
  perfiles,
  vista,
  onSeleccionarPieza,
  onMedir,
  onCerrar,
}: MedidorPiezaProps): JSX.Element {
  const { orientacion, tipo, anchoCm, altoCm } = pieza;
  const esPunto = orientacion === 'punto';
  const esVidrio = tipo === 'vidrio' || tipo === 'acrilico';

  const contexto = useMemo(
    () => crearContextosPiezas([pieza], perfiles).get(pieza.id),
    [pieza, perfiles],
  );

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
      {contexto && (
        <div className="medidor-seccion">
          <SeccionPieza
            identidad={contexto.identidad}
            params={contexto.params}
            interior={contexto.interior}
            pieza={pieza}
            ancho={88}
            alto={64}
          />
          <span className="medidor-seccion-etiqueta">
            {ETIQUETA_CLASE[contexto.identidad.clase]}
            {contexto.identidad.sistema ? ` · ${contexto.identidad.sistema}` : ''}
          </span>
        </div>
      )}
    </div>
  );
}