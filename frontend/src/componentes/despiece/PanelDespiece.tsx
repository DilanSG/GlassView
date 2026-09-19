import type { DespiecePiezas, PiezaPlano } from '../../tipos';

export interface PanelDespieceProps {
  cantidadPiezas: number;
  despiece: DespiecePiezas | null;
  piezaSeleccionada: PiezaPlano | null;
  onEliminarPieza: (id: string) => void;
}

function medidaSeleccionada(pieza: PiezaPlano): string {
  if (pieza.orientacion === 'punto') return 'Punto de inserción';
  return `${pieza.anchoCm} × ${pieza.altoCm} cm`;
}

/** Despiece agrupado por REF con el resumen de la obra y el detalle de la pieza activa. */
export default function PanelDespiece({
  cantidadPiezas,
  despiece,
  piezaSeleccionada,
  onEliminarPieza,
}: PanelDespieceProps): JSX.Element {
  const perfiles = despiece?.lineas.filter((linea) => linea.tipo !== 'herraje') ?? [];
  const herrajes = despiece?.lineas.filter((linea) => linea.tipo === 'herraje') ?? [];

  if (cantidadPiezas === 0) {
    return (
      <section className="panel-despiece" aria-label="Despiece del plano">
        <p className="sin-datos">Dibuja una pieza o coloca una plantilla para ver el despiece.</p>
      </section>
    );
  }

  if (!despiece) {
    return (
      <section className="panel-despiece" aria-label="Despiece del plano">
        <p className="mensaje-error">No se pudo calcular el despiece.</p>
      </section>
    );
  }

  return (
    <section className="panel-despiece" aria-label="Despiece del plano">
      <div className="despiece-resumen">
        <div className="despiece-stat">
          <span className="despiece-stat-valor">{perfiles.length}</span>
          <span className="despiece-stat-etiqueta">perfiles</span>
          <span className="despiece-stat-detalle">{despiece.totalMl} ml</span>
        </div>
        <div className="despiece-stat">
          <span className="despiece-stat-valor">{despiece.vidrios.length}</span>
          <span className="despiece-stat-etiqueta">vidrios</span>
          <span className="despiece-stat-detalle">{despiece.totalVidrioM2} m²</span>
        </div>
        <div className="despiece-stat">
          <span className="despiece-stat-valor">{despiece.totalHerrajes}</span>
          <span className="despiece-stat-etiqueta">herrajes</span>
          <span className="despiece-stat-detalle">piezas</span>
        </div>
      </div>

      {perfiles.length > 0 && (
        <section className="bloque-lista">
          <h3 className="bloque-titulo">
            Perfiles
            <span className="bloque-cuenta">{perfiles.length}</span>
          </h3>
          <ul className="lista-despiece">
            {perfiles.map((linea) => (
              <li key={linea.ref} className="fila-despiece">
                <span className="despiece-descripcion">
                  <span className="despiece-nombre">{linea.descripcion}</span>
                  <span className="despiece-ref">{linea.ref}</span>
                </span>
                <span className="despiece-cantidad">×{linea.cantidad}</span>
                <span className="despiece-medida-cm">{linea.ml} ml</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {despiece.vidrios.length > 0 && (
        <section className="bloque-lista">
          <h3 className="bloque-titulo">
            Vidrios
            <span className="bloque-cuenta">{despiece.vidrios.length}</span>
          </h3>
          <ul className="lista-despiece">
            {despiece.vidrios.map((vidrio, indice) => (
              <li key={indice} className="fila-despiece">
                <span className="despiece-descripcion">
                  <span className="despiece-nombre">{vidrio.descripcion}</span>
                  <span className="despiece-ref">{vidrio.espesorMm} mm</span>
                </span>
                <span className="despiece-cantidad">×{vidrio.cantidad}</span>
                <span className="despiece-medida-cm">
                  {vidrio.altoCm} × {vidrio.anchoCm} cm
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {herrajes.length > 0 && (
        <section className="bloque-lista">
          <h3 className="bloque-titulo">
            Herrajes
            <span className="bloque-cuenta">{despiece.totalHerrajes}</span>
          </h3>
          <ul className="lista-despiece">
            {herrajes.map((linea) => (
              <li key={linea.ref} className="fila-despiece">
                <span className="despiece-descripcion">
                  <span className="despiece-nombre">{linea.descripcion}</span>
                  <span className="despiece-ref">{linea.ref}</span>
                </span>
                <span className="despiece-cantidad">×{linea.cantidad}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {piezaSeleccionada && (
        <section className="pieza-ficha">
          <header className="pieza-ficha-cabecera">
            <h3>{piezaSeleccionada.descripcion || piezaSeleccionada.ref}</h3>
            <span className="pieza-ficha-tipo">{piezaSeleccionada.tipo}</span>
          </header>
          <dl className="pieza-ficha-datos">
            <div>
              <dt>REF</dt>
              <dd>{piezaSeleccionada.ref}</dd>
            </div>
            <div>
              <dt>Medida</dt>
              <dd>{medidaSeleccionada(piezaSeleccionada)}</dd>
            </div>
            <div>
              <dt>Posición</dt>
              <dd>
                x {piezaSeleccionada.x} · y {piezaSeleccionada.y} cm
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="boton-eliminar"
            onClick={() => onEliminarPieza(piezaSeleccionada.id)}
          >
            Eliminar pieza
          </button>
        </section>
      )}
    </section>
  );
}
