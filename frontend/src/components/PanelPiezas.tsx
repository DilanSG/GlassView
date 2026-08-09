import type { PiezaPlano } from '../tipos';

interface PanelPiezasProps {
  piezas: PiezaPlano[];
  piezaSeleccionadaId: string | null;
  onSeleccionarPieza: (id: string | null) => void;
  onEliminarPieza: (id: string) => void;
}

function tipoPanelPieza(pieza: PiezaPlano): string {
  if (pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico') return 'vidrio';
  if (pieza.orientacion === 'punto') return 'herraje';
  return 'perfil';
}

function medidaPieza(pieza: PiezaPlano): string {
  if (pieza.orientacion === 'punto') {
    return `${pieza.cantidad} pza`;
  }
  if (pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico') {
    return `${pieza.anchoCm} × ${pieza.altoCm} cm`;
  }
  const largo = pieza.orientacion === 'horizontal' ? pieza.anchoCm : pieza.altoCm;
  const grosor = pieza.orientacion === 'horizontal' ? pieza.altoCm : pieza.anchoCm;
  return `${largo} cm × ${grosor} cm`;
}

/**
 * Lista individual de todas las piezas del plano: permite seleccionar en el
 * lienzo y eliminar. Se muestra en la columna derecha del editor.
 */
export default function PanelPiezas({
  piezas,
  piezaSeleccionadaId,
  onSeleccionarPieza,
  onEliminarPieza,
}: PanelPiezasProps) {
  return (
    <aside className="panel-piezas">
      <h2>Piezas ({piezas.length})</h2>
      {piezas.length === 0 ? (
        <p className="sin-datos">Aún no hay piezas en el plano.</p>
      ) : (
        <ul className="lista-piezas">
          {piezas.map((pieza) => {
            const seleccionada = pieza.id === piezaSeleccionadaId;
            return (
              <li
                key={pieza.id}
                className={`lista-piezas-item ${seleccionada ? 'activo' : ''}`}
                onClick={() => onSeleccionarPieza(seleccionada ? null : pieza.id)}
                title="Seleccionar en el lienzo"
              >
                <span className={`pieza-badge pieza-badge-${tipoPanelPieza(pieza)}`} />
                <span className="pieza-info">
                  <span className="pieza-nombre">
                    {pieza.descripcion || pieza.ref || pieza.tipo}
                  </span>
                  <span className="pieza-meta">
                    {tipoPanelPieza(pieza)}
                    {pieza.ref ? ` · ${pieza.ref}` : ''} · {medidaPieza(pieza)}
                  </span>
                </span>
                <button
                  type="button"
                  className="lista-piezas-eliminar"
                  title="Eliminar pieza"
                  onClick={(evento) => {
                    evento.stopPropagation();
                    onEliminarPieza(pieza.id);
                  }}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}