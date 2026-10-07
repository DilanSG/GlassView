import { useEffect, useRef } from 'react';
import type { PerfilVentaneria } from '../../tipos';
import SeccionPieza from '../piezas/SeccionPieza';
import { identidadDePerfil, parametrosDe } from '../../piezas/resolver';

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
  const campoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Solo se enfoca con ratón: en el móvil abriría el teclado al dibujar.
    if (window.matchMedia?.('(pointer: fine)').matches) {
      campoRef.current?.focus();
    }
  }, []);

  return (
    <div className="selector-ref">
      <div className="selector-ref-cabecera">
        <strong>Elige el perfil ({categoria})</strong>
        <button type="button" className="boton-eliminar" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      <input
        ref={campoRef}
        value={terminoBusqueda}
        onChange={(evento) => onBuscar(evento.target.value)}
        placeholder="Buscar referencia..."
      />
      <ul className="selector-ref-lista">
        {resultados.map((perfil) => {
          const identidad = identidadDePerfil(perfil);
          return (
            <li key={perfil.ref}>
              <button
                type="button"
                className="selector-ref-item"
                onClick={() => onElegir(perfil.ref, perfil.descripcion)}
              >
                <span className="selector-ref-vista">
                  <SeccionPieza
                    identidad={identidad}
                    params={parametrosDe(identidad)}
                    ancho={36}
                    alto={26}
                  />
                </span>
                <span className="selector-ref-ref">{perfil.ref}</span>
                <span className="selector-ref-desc">{perfil.descripcion}</span>
              </button>
            </li>
          );
        })}
        {resultados.length === 0 && (
          <li className="selector-ref-vacio">Sin resultados para «{terminoBusqueda}»</li>
        )}
      </ul>
    </div>
  );
}