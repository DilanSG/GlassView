import { Outlet } from 'react-router-dom';
import BarraNavegacion from './BarraNavegacion';

export default function Estructura() {
  return (
    <>
      <BarraNavegacion />
      <Outlet />
    </>
  );
}