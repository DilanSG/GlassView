import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import BotonTema from './BotonTema';
import PieDePagina from './PieDePagina';

interface PaginaAutenticacionProps {
  /** Tarjeta con el formulario de acceso o registro. */
  children: ReactNode;
}

/**
 * Estructura de las pantallas de acceso y registro: sin barra de navegación,
 * el logo grande a la izquierda y el formulario a la derecha.
 */
export default function PaginaAutenticacion({ children }: PaginaAutenticacionProps) {
  return (
    <div className="pantalla-autenticacion">
      <div className="autenticacion-tema">
        <BotonTema />
      </div>

      <main className="autenticacion">
        <section className="autenticacion-logo">
          <Link to="/" className="autenticacion-marca" title="Ir al inicio">
            <img src="/icono.png" alt="GlassView" className="autenticacion-icono" />
            <span>GlassView</span>
          </Link>
        </section>

        <section className="autenticacion-formulario">{children}</section>
      </main>

      <PieDePagina />
    </div>
  );
}
