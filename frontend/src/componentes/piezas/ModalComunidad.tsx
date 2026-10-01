import { useEffect } from 'react';
import type { PiezaPersonalizada } from '../../tipos';
import MiniaturaForma from './MiniaturaForma';

export interface ModalComunidadProps {
  piezas: PiezaPersonalizada[];
  onElegir: (pieza: PiezaPersonalizada) => void;
  onCerrar: () => void;
}

/** Galería de piezas públicas de otras cuentas para usarlas como plantilla. */
export default function ModalComunidad({ piezas, onElegir, onCerrar }: ModalComunidadProps) {
  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [onCerrar]);

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label="Piezas de la comunidad">
      <div className="modal modal-comunidad">
        <header className="modal-cabecera">
          <div>
            <h3>Piezas de la comunidad</h3>
            <p>Piezas públicas que otras cuentas comparten para reutilizar.</p>
          </div>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        {piezas.length === 0 ? (
          <p className="sin-datos">Todavía no hay piezas públicas de otras cuentas.</p>
        ) : (
          <ul className="rejilla-comunidad">
            {piezas.map((pieza) => (
              <li key={pieza._id}>
                <button
                  type="button"
                  className="tarjeta-comunidad"
                  onClick={() => onElegir(pieza)}
                  title="Usar esta pieza como base"
                >
                  <span className="tarjeta-comunidad-vista">
                    <MiniaturaForma forma={pieza.forma} tipo={pieza.tipo} />
                  </span>
                  <span className="tarjeta-comunidad-info">
                    <span className="tarjeta-comunidad-nombre">{pieza.nombre}</span>
                    <span className="tarjeta-comunidad-meta">
                      {pieza.ref} · {pieza.tipo}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
