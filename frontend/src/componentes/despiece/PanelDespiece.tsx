import type { DespiecePiezas, PiezaPlano } from '../../tipos';

export interface PanelDespieceProps {
  cantidadPiezas: number;
  despiece: DespiecePiezas | null;
  piezaSeleccionada: PiezaPlano | null;
  onEliminarPieza: (id: string) => void;
}

/** Panel con el despiece agrupado por REF y el detalle de la pieza seleccionada. */
export default function PanelDespiece({
  cantidadPiezas,
  despiece,
  piezaSeleccionada,
  onEliminarPieza,
}: PanelDespieceProps): JSX.Element {
  return (
    <aside className="panel-despiece">
      <h2>Despiece</h2>
      {cantidadPiezas === 0 ? (
        <p className="sin-datos">
          Dibuja una pieza o coloca una plantilla para ver el despiece.
        </p>
      ) : despiece ? (
        <div className="despiece-detalle">
          <p className="despiece-resumen">
            {despiece.lineas.length} perfiles · {despiece.vidrios.length} vidrios ·{' '}
            {despiece.totalMl} ml · {despiece.totalVidrioM2} m² de vidrio
          </p>

          {despiece.lineas.length > 0 && (
            <details open>
              <summary>Perfiles y herrajes ({despiece.lineas.length})</summary>
              <ul className="lista-despiece">
                {despiece.lineas.map((linea) => (
                  <li key={linea.ref} className="fila-despiece">
                    <span className="despiece-descripcion">
                      {linea.descripcion} <small>{linea.ref}</small>
                    </span>
                    <span className="despiece-cantidad">×{linea.cantidad}</span>
                    <span className="despiece-medida-cm">
                      {linea.ml} ml{linea.subtotal ? ` · $${linea.subtotal}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}

          {despiece.vidrios.length > 0 && (
            <details>
              <summary>Vidrios ({despiece.vidrios.length})</summary>
              <ul className="lista-despiece">
                {despiece.vidrios.map((vidrio, indice) => (
                  <li key={indice} className="fila-despiece">
                    <span className="despiece-descripcion">
                      {vidrio.descripcion} <small>{vidrio.espesorMm} mm</small>
                    </span>
                    <span className="despiece-cantidad">×{vidrio.cantidad}</span>
                    <span className="despiece-medida-cm">
                      {vidrio.altoCm} × {vidrio.anchoCm} cm · {vidrio.m2} m²
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : (
        <p className="mensaje-error">No se pudo calcular el despiece.</p>
      )}

      {piezaSeleccionada && (
        <div className="pieza-detalle">
          <h3>Pieza seleccionada</h3>
          <p className="despiece-medida">
            {piezaSeleccionada.descripcion || piezaSeleccionada.ref}
          </p>
          <dl className="pieza-campos">
            <dt>REF</dt>
            <dd>{piezaSeleccionada.ref}</dd>
            <dt>Posición</dt>
            <dd>
              x {piezaSeleccionada.x} · y {piezaSeleccionada.y} cm
            </dd>
            <dt>Medida</dt>
            <dd>
              {piezaSeleccionada.orientacion === 'punto'
                ? 'Punto'
                : `${piezaSeleccionada.anchoCm} × ${piezaSeleccionada.altoCm} cm`}
            </dd>
            {piezaSeleccionada.largoCm > 0 && (
              <>
                <dt>Largo</dt>
                <dd>{piezaSeleccionada.largoCm} cm</dd>
              </>
            )}
          </dl>
          <button
            type="button"
            className="boton-eliminar"
            onClick={() => onEliminarPieza(piezaSeleccionada.id)}
          >
            Eliminar pieza
          </button>
        </div>
      )}
    </aside>
  );
}