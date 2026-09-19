import { Outlet, useLocation } from 'react-router-dom';
import AvisoPrueba from './AvisoPrueba';
import BarraNavegacion from './BarraNavegacion';
import PieDePagina from './PieDePagina';

export default function Estructura() {
  const { pathname } = useLocation();
  // El editor ocupa toda la ventana: sin pie de página y con altura fija.
  const enEditor = /^\/proyectos\/[^/]+$/.test(pathname);

  return (
    <div className={`estructura-app ${enEditor ? 'estructura-editor' : ''}`}>
      <BarraNavegacion />
      <AvisoPrueba />
      <main className="contenido-app">
        <Outlet />
      </main>
      {!enEditor && <PieDePagina />}
    </div>
  );
}
