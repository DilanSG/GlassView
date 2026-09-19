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

type NombreIconoMenu = 'perfil' | 'plan' | 'usuarios' | 'salir';

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
  }
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
          className={`boton-usuario ${menuAbierto ? 'abierto' : ''}`}
          aria-haspopup="menu"
          aria-expanded={menuAbierto}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
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

            <NavLink
              to="/perfil"
              className="menu-usuario-enlace"
              onClick={() => setMenuAbierto(false)}
            >
              <IconoMenu nombre="perfil" />
              <span>Mi perfil</span>
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
