import { NavLink } from 'react-router-dom';
import BotonTema from './BotonTema';

export default function BarraNavegacion() {
  return (
    <nav className="barra-navegacion">
      <NavLink to="/proyectos" className="marca-navegacion">
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
    </nav>
  );
}