import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSesion } from '../contextos/SesionContexto';
import { useEsMovil } from '../hooks/useEsMovil';
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

type NombreIconoMenu =
  | 'perfil'
  | 'plan'
  | 'usuarios'
  | 'salir'
  | 'proyectos'
  | 'nuevo'
  | 'piezas';

const FICHA_MENU = {
  viewBox: '0 0 24 24',
  width: 17,
  height: 17,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

function IconoMenu({ nombre }: { nombre: NombreIconoMenu }): JSX.Element {
  switch (nombre) {
    case 'perfil':
      return (
        <svg {...FICHA_MENU}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 19.5c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5" />
        </svg>
      );
    case 'plan':
      return (
        <svg {...FICHA_MENU}>
          <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
          <path d="M3 10h18" />
        </svg>
      );
    case 'usuarios':
      return (
        <svg {...FICHA_MENU}>
          <circle cx="9" cy="8.5" r="3" />
          <path d="M3.5 19c1.2-2.6 3.2-3.9 5.5-3.9s4.3 1.3 5.5 3.9" />
          <path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 15.2c1.3.6 2.4 1.8 3 3.3" />
        </svg>
      );
    case 'salir':
      return (
        <svg {...FICHA_MENU}>
          <path d="M14 5.5h4a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-4" />
          <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12H15" />
        </svg>
      );
    case 'proyectos':
      return (
        <svg {...FICHA_MENU}>
          <path d="M3.5 7.5h5.6l1.6 2.2h9.8v9.3a1.5 1.5 0 0 1-1.5 1.5h-14a1.5 1.5 0 0 1-1.5-1.5V9a1.5 1.5 0 0 1 1.5-1.5Z" />
        </svg>
      );
    case 'nuevo':
      return (
        <svg {...FICHA_MENU}>
          <path d="M12 5.5v13M5.5 12h13" />
        </svg>
      );
    case 'piezas':
      return (
        <svg {...FICHA_MENU}>
          <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
          <path d="M4 8l8 4.5L20 8M12 12.5v8" />
        </svg>
      );
  }
}

export default function BarraNavegacion() {
  const { usuario, cerrarSesion } = useSesion();
  const esMovil = useEsMovil();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Al cambiar entre móvil y escritorio el menú deja de tener sentido abierto.
  useEffect(() => {
    setMenuAbierto(false);
  }, [esMovil]);

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

  return (
    <nav className="barra-navegacion">
      <NavLink to="/proyectos" className="marca-navegacion" aria-label="GlassView">
        <img src="/icono.png" alt="" className="marca-logo" />
        <span className="marca-texto">GlassView</span>
      </NavLink>

      {!esMovil && (
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
          <NavLink
            to="/piezas"
            className={({ isActive }) => `enlace-nav ${isActive ? 'activo' : ''}`}
          >
            Piezas          </NavLink>
        </div>
      )}

      {!esMovil && <BotonTema />}

      <div className="menu-usuario" ref={menuRef}>
        <button
          type="button"
          className={`boton-usuario ${menuAbierto ? 'abierto' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          aria-label={esMovil ? (menuAbierto ? 'Cerrar menú' : 'Abrir menú') : undefined}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          {esMovil ? (
            <svg
              className="usuario-icono-menu"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              {menuAbierto ? (
                <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          ) : (
            <>
              <span className="usuario-nombre">{usuario?.nombre}</span>
              <svg
                className="usuario-flecha"
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </>
          )}
        </button>

        {menuAbierto && (
          <div className="menu-usuario-panel" role="menu">
            <div className="menu-usuario-cabecera">
              <strong className="menu-usuario-nombre">{usuario?.nombre}</strong>
              <span className="menu-usuario-correo">{usuario?.email}</span>
              <span className={`chip-plan chip-plan-${usuario?.estado.motivo}`}>
                {usuario ? etiquetaPlan(usuario) : ''}
              </span>
            </div>

            {esMovil && (
              <div className="menu-usuario-seccion">
                <NavLink
                  to="/proyectos"
                  className={({ isActive }) =>
                    `menu-usuario-enlace ${isActive ? 'activo' : ''}`
                  }
                  onClick={() => setMenuAbierto(false)}
                >
                  <IconoMenu nombre="proyectos" />
                  <span>Proyectos</span>
                </NavLink>
                <NavLink
                  to="/nuevo-proyecto"
                  className={({ isActive }) =>
                    `menu-usuario-enlace ${isActive ? 'activo' : ''}`
                  }
                  onClick={() => setMenuAbierto(false)}
                >
                  <IconoMenu nombre="nuevo" />
                  <span>Nuevo proyecto</span>
                </NavLink>
                <NavLink
                  to="/piezas"
                  className={({ isActive }) =>
                    `menu-usuario-enlace ${isActive ? 'activo' : ''}`
                  }
                  onClick={() => setMenuAbierto(false)}
                >
                  <IconoMenu nombre="piezas" />
                  <span>Piezas</span>
                </NavLink>
              </div>
            )}

            <NavLink
              to="/perfil"
              className="menu-usuario-enlace"
              onClick={() => setMenuAbierto(false)}
            >
              <IconoMenu nombre="perfil" />
              <span>Perfil</span>
            </NavLink>
            <NavLink
              to="/facturacion"
              className="menu-usuario-enlace"
              onClick={() => setMenuAbierto(false)}
            >
              <IconoMenu nombre="plan" />
              <span>Facturación y plan</span>
            </NavLink>
            {usuario?.rol === 'admin' && (
              <NavLink
                to="/admin/usuarios"
                className="menu-usuario-enlace"
                onClick={() => setMenuAbierto(false)}
              >
                <IconoMenu nombre="usuarios" />
                <span>Administrar usuarios</span>
              </NavLink>
            )}

            {esMovil && (
              <div className="menu-usuario-tema">
                <span>Tema</span>
                <BotonTema />
              </div>
            )}

            <button type="button" className="menu-usuario-salir" onClick={cerrarSesion}>
              <IconoMenu nombre="salir" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
