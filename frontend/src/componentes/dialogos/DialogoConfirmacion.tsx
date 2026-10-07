import { useEffect, useState, type MouseEvent } from 'react';
import { resaltar } from '../../utils/resaltar';

export interface OpcionesConfirmacion {
  titulo: string;
  mensaje: string;
  /** Texto del botón que confirma (por defecto «Confirmar»). */
  textoConfirmar?: string;
  /** Texto del botón que cancela (por defecto «Cancelar»). */
  textoCancelar?: string;
  /** Marca la acción como destructiva (botón rojo). */
  peligro?: boolean;
  /**
   * Texto que hay que escribir para habilitar la confirmación; útil en
   * acciones irreversibles como eliminar la cuenta.
   */
  textoExigido?: string;
}

export interface DialogoConfirmacionProps {
  opciones: OpcionesConfirmacion;
  onResponder: (confirmado: boolean) => void;
}

/**
 * Diálogo de confirmación reutilizable que sustituye a los `window.confirm`
 * nativos: mismo estilo de los modales de la app, con Escape y clic fuera para
 * cancelar y confirmación por texto en acciones críticas.
 */
export default function DialogoConfirmacion({
  opciones,
  onResponder,
}: DialogoConfirmacionProps): JSX.Element {
  const [texto, setTexto] = useState('');
  const peligro = opciones.peligro ?? false;
  const exigido = opciones.textoExigido?.trim().toLowerCase() ?? '';
  const valido = !exigido || texto.trim().toLowerCase() === exigido;

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') {
        onResponder(false);
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [onResponder]);

  return (
    <div
      className="modal-fondo"
      role="dialog"
      aria-modal="true"
      aria-label={opciones.titulo}
      onMouseDown={(evento: MouseEvent<HTMLDivElement>) => {
        if (evento.target === evento.currentTarget) {
          onResponder(false);
        }
      }}
    >
      <div className="modal modal-confirmacion">
        <header className="modal-cabecera">
          <div>
            <h3>{opciones.titulo}</h3>
            <p>{opciones.mensaje}</p>
          </div>
        </header>

        {opciones.textoExigido && (
          <div className="campo">
            <label htmlFor="confirmar-texto">
              Escribe {resaltar(`«${opciones.textoExigido}»`)} para confirmar
            </label>
            <input
              id="confirmar-texto"
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        <div className="modal-acciones">
          <button type="button" className="boton-secundario" onClick={() => onResponder(false)}>
            {opciones.textoCancelar ?? 'Cancelar'}
          </button>
          <button
            type="button"
            className={peligro ? 'boton-peligro' : 'boton-primario'}
            disabled={!valido}
            onClick={() => onResponder(true)}
            autoFocus={!opciones.textoExigido}
          >
            {opciones.textoConfirmar ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
