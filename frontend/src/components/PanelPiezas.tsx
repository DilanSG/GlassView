import type { PiezaPlano } from '../tipos';

interface PanelPiezasProps {
  piezas: PiezaPlano[];
  piezaSeleccionadaId: string | null;
  onSeleccionarPieza: (id: string | null) => void;
  onEliminarPieza: (id: string) => void;
}

type GrupoId = 'perfil' | 'vidrio' | 'herraje';

const GRUPOS: Array<{ id: GrupoId; etiqueta: string }> = [
  { id: 'perfil', etiqueta: 'Perfiles' },
  { id: 'vidrio', etiqueta: 'Vidrios' },
  { id: 'herraje', etiqueta: 'Herrajes' },
];

function grupoDe(pieza: PiezaPlano): GrupoId {
  if (pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico') return 'vidrio';
  return pieza.orientacion === 'punto' ? 'herraje' : 'perfil';
}

function medidaPieza(pieza: PiezaPlano): string | null {
  if (pieza.orientacion === 'punto') return null;
  if (pieza.tipo === 'vidrio' || pieza.tipo === 'acrilico') {
    return `${pieza.anchoCm} × ${pieza.altoCm} cm`;
  }
  const largo = pieza.orientacion === 'horizontal' ? pieza.anchoCm : pieza.altoCm;
  const grosor = pieza.orientacion === 'horizontal' ? pieza.altoCm : pieza.anchoCm;
  return `${largo} × ${grosor} cm`;
}

/** Lista de piezas agrupadas por tipo, para seleccionar en el lienzo o eliminar. */
export default function PanelPiezas({
  piezas,
  piezaSeleccionadaId,
  onSeleccionarPieza,
  onEliminarPieza,
}: PanelPiezasProps) {
  const agrupadas = GRUPOS.map((grupo) => ({
    ...grupo,
    piezas: piezas.filter((pieza) => grupoDe(pieza) === grupo.id),
  }));
  const conPiezas = agrupadas.filter((grupo) => grupo.piezas.length > 0);

  if (piezas.length === 0) {
    return (
      <section className="panel-piezas" aria-label="Piezas del plano">
        <p className="sin-datos">Aún no hay piezas en el plano.</p>
      </section>
    );
  }

  return (
    <section className="panel-piezas" aria-label="Piezas del plano">
      <p className="panel-resumen">
        {conPiezas.map((grupo) => `${grupo.piezas.length} ${grupo.etiqueta.toLowerCase()}`).join(' · ')}
      </p>

      {conPiezas.map((grupo) => (
        <section key={grupo.id} className="bloque-lista">
          <h3 className="bloque-titulo">
            {grupo.etiqueta}
            <span className="bloque-cuenta">{grupo.piezas.length}</span>
          </h3>
          <ul className="lista-piezas">
            {grupo.piezas.map((pieza) => {
              const seleccionada = pieza.id === piezaSeleccionadaId;
              const medida = medidaPieza(pieza);
              return (
                <li
                  key={pieza.id}
                  className={`lista-piezas-item ${seleccionada ? 'activo' : ''}`}
                  onClick={() => onSeleccionarPieza(seleccionada ? null : pieza.id)}
                  title="Seleccionar en el lienzo"
                >
                  <span className={`pieza-badge pieza-badge-${grupo.id}`} />
                  <span className="pieza-info">
                    <span className="pieza-nombre">
                      {pieza.descripcion || pieza.ref || pieza.tipo}
                    </span>
                    <span className="pieza-meta">
                      {pieza.ref && <span className="pieza-ref">{pieza.ref}</span>}
                      {pieza.cantidad > 1 && <span>×{pieza.cantidad}</span>}
                    </span>
                  </span>
                  {medida && <span className="pieza-medida">{medida}</span>}
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
        </section>
      ))}
    </section>
  );
}
