import { useMemo } from 'react';
import type { PerfilVentaneria, PiezaPlano } from '../../tipos';
import { valorCm } from '../../utils/geometria';
import { crearContextosPiezas } from '../../piezas/contexto';
import { ETIQUETA_CLASE } from '../../piezas/resolver';

export interface MedidorPiezaProps {
  pieza: PiezaPlano;
  perfiles: PerfilVentaneria[];
  onSeleccionarPieza: (id: string | null) => void;
  onMedir: (cambios: Partial<PiezaPlano>) => void;
  onCerrar: () => void;
}

function milimetros(valorCm: number): string {
  return `${(valorCm * 10).toFixed(1)} mm`;
}

/**
 * Ficha de la pieza seleccionada, anclada a la esquina inferior izquierda del
 * lienzo: tipo, referencia, medidas editables, especificaciones del perfil y
 * su sección transversal.
 */
export default function MedidorPieza({
  pieza,
  perfiles,
  onSeleccionarPieza,
  onMedir,
  onCerrar,
}: MedidorPiezaProps): JSX.Element {
  const { orientacion, tipo, anchoCm, altoCm, cantidad, espesorMm, ref, descripcion } = pieza;
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

  const largo = orientacion === 'horizontal' ? anchoCm : altoCm;
  const grosor = orientacion === 'horizontal' ? altoCm : anchoCm;
  const etiquetaClase = contexto ? ETIQUETA_CLASE[contexto.identidad.clase] : tipo;

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
    return (
      <div className="medidor-campos">
        <label className="medidor-campo">
          Largo
          <input
            key={`largo-${pieza.id}`}
            type="number"
            min="0.1"
            step="0.1"
            defaultValue={largo}
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
            defaultValue={grosor}
            onChange={(evento) => aplicarGrosor(evento.target.value)}
          />
          cm
        </label>
      </div>
    );
  };

  return (
    <div className="medidor-pieza">
      <div className="medidor-cabecera">
        <span className="medidor-nombre">{etiquetaClase}</span>
        {ref && <span className="medidor-ref">{ref}</span>}
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

      <dl className="medidor-especificaciones">
        <div>
          <dt>Tipo</dt>
          <dd>{etiquetaClase}</dd>
        </div>
        {contexto?.identidad.sistema && (
          <div>
            <dt>Sistema</dt>
            <dd>{contexto.identidad.sistema}</dd>
          </div>
        )}
        {descripcion && (
          <div>
            <dt>Descripción</dt>
            <dd>{descripcion}</dd>
          </div>
        )}
        <div>
          <dt>Medidas</dt>
          <dd>{esPunto ? 'Puntual' : `${largo} × ${grosor} cm`}</dd>
        </div>
        {esVidrio && (
          <div>
            <dt>Espesor</dt>
            <dd>{espesorMm} mm</dd>
          </div>
        )}
        {!esVidrio && !esPunto && contexto && (
          <div>
            <dt>Perfil</dt>
            <dd>
              pared {milimetros(contexto.params.pared)} · garganta {milimetros(contexto.params.garganta)}
            </dd>
          </div>
        )}
        <div>
          <dt>Cantidad</dt>
          <dd>{cantidad}</dd>
        </div>
      </dl>
    </div>
  );
}
