import { Outlet } from 'react-router-dom';
import BarraNavegacion from './BarraNavegacion';
import PieDePagina from './PieDePagina';

export default function Estructura() {
  return (
    <div className="estructura-app">
      <BarraNavegacion />
      <main className="contenido-app">
        <Outlet />
      </main>
      <PieDePagina />
    </div>
  );
}