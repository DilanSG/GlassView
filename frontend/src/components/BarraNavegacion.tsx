import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSesion } from '../contextos/SesionContexto';
import type { Usuario } from '../tipos';
import BotonTema from './BotonTema';

function etiquetaPlan(usuario: Usuario): string {
  const { estado } = usuario;
  if (estado.motivo === 'suscripcion') {
    return 'Plan activo';
  }
  if (estado.motivo === 'prueba') {
    return `Prueba · ${estado.diasPruebaRestantes} días`;
  }
  return 'Prueba terminada';
}

export default function BarraNavegacion() {
  const { usuario, cerrarSesion } = useSesion();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuAbierto) {
      return;
    }

    function manejarClic(evento: MouseEvent): void {
      if (menuRef.current && !menuRef.current.contains(evento.target as Node)) {
        setMenuAbierto(false);
      }
    }
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') {
        setMenuAbierto(false);
      }
    }

    document.addEventListener('mousedown', manejarClic);
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('mousedown', manejarClic);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, [menuAbierto]);

  const inicial = usuario?.nombre?.trim().charAt(0).toUpperCase() || '?';

  return (
    <nav className="barra-navegacion">
      <NavLink to="/proyectos" className="marca-navegacion">
        <img src="/icono.png" alt="" className="marca-logo" />
        GlassView
      </NavLink>

      <div className="navegacion-enlaces">
        <NavLink
          to="/proyectos"
          className={({ isActive }) => `enlace-nav ${isActive ? 'activo' : ''}`}
        >
          Proyectos
        </NavLink>
        <NavLink
          to="/nuevo-proyecto"
          className={({ isActive }) => `enlace-nav ${isActive ? 'activo' : ''}`}
        >
          Nuevo proyecto
        </NavLink>
      </div>

      <BotonTema />

      <div className="menu-usuario" ref={menuRef}>
        <button
          type="button"
          className="boton-usuario"
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span className="usuario-avatar">{inicial}</span>
          <span className="usuario-nombre">{usuario?.nombre}</span>
        </button>

        {menuAbierto && (
          <div className="menu-usuario-panel" role="menu">
            <div className="menu-usuario-cabecera">
              <strong>{usuario?.nombre}</strong>
              <span className="menu-usuario-correo">{usuario?.email}</span>
              <span className={`chip-plan chip-plan-${usuario?.estado.motivo}`}>
                {usuario ? etiquetaPlan(usuario) : ''}
              </span>
            </div>

            <NavLink to="/perfil" className="menu-usuario-enlace" onClick={() => setMenuAbierto(false)}>
              Mi perfil
            </NavLink>
            <NavLink
              to="/facturacion"
              className="menu-usuario-enlace"
              onClick={() => setMenuAbierto(false)}
            >
              Facturación y plan
            </NavLink>
            {usuario?.rol === 'admin' && (
              <NavLink
                to="/admin/usuarios"
                className="menu-usuario-enlace"
                onClick={() => setMenuAbierto(false)}
              >
                Administrar usuarios
              </NavLink>
            )}
            <button type="button" className="menu-usuario-salir" onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
