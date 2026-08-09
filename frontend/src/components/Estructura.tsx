import { Outlet } from 'react-router-dom';
import BarraNavegacion from './BarraNavegacion';
import PieDePagina from './PieDePagina';

export default function Estructura() {
  return (
    <>
      <BarraNavegacion />
      <Outlet />
      <PieDePagina />
    </>
  );
}