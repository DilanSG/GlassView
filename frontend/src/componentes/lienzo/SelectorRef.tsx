import type { PerfilVentaneria } from '../../tipos';

export interface SelectorRefProps {
  categoria: string;
  terminoBusqueda: string;
  resultados: PerfilVentaneria[];
  onBuscar: (termino: string) => void;
  onCancelar: () => void;
  onElegir: (ref: string, descripcion: string) => void;
}

/** Diálogo flotante para elegir la referencia del catálogo tras dibujar. */
export default function SelectorRef({
  categoria,
  terminoBusqueda,
  resultados,
  onBuscar,
  onCancelar,
  onElegir,
}: SelectorRefProps): JSX.Element {
  return (
    <div className="selector-ref">
      <div className="selector-ref-cabecera">
        <strong>Elige el perfil ({categoria})</strong>
        <button type="button" className="boton-eliminar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      <input
        autoFocus
        value={terminoBusqueda}
        onChange={(evento) => onBuscar(evento.target.value)}
        placeholder="Buscar referencia..."
      />
      <ul className="selector-ref-lista">
        {resultados.map((perfil) => (
          <li key={perfil.ref}>
            <button
              type="button"
              className="selector-ref-item"
              onClick={() => onElegir(perfil.ref, perfil.descripcion)}
            >
              <span className="selector-ref-ref">{perfil.ref}</span>
              <span className="selector-ref-desc">{perfil.descripcion}</span>
              <span className="selector-ref-precio">
                {perfil.precioMetro ? `$${perfil.precioMetro}/m` : ''}
              </span>
            </button>
          </li>
        ))}
        {resultados.length === 0 && (
          <li className="selector-ref-vacio">Sin resultados para «{terminoBusqueda}»</li>
        )}
      </ul>
    </div>
  );
}