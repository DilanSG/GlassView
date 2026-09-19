import type { ReactNode } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { haySesionActiva } from './api/clienteApi';
import Estructura from './components/Estructura';
import PulsosPlano from './components/PulsosPlano';
import { SesionProveedor, useSesion } from './contextos/SesionContexto';
import Acceso from './pages/Acceso';
import AdminUsuarios from './pages/AdminUsuarios';
import EditorPlano from './pages/EditorPlano';
import Facturacion from './pages/Facturacion';
import Inicio from './pages/Inicio';
import NuevoProyecto from './pages/NuevoProyecto';
import Perfil from './pages/Perfil';
import Proyectos from './pages/Proyectos';
import Registro from './pages/Registro';

/** Exige una sesión activa; si no la hay, envía a la pantalla de acceso. */
function RutaProtegida() {
  const { usuario, cargando } = useSesion();
  const ubicacion = useLocation();

  if (cargando) {
    return <p className="sesion-cargando">Cargando tu sesión…</p>;
  }

  if (!haySesionActiva() || !usuario) {
    return <Navigate to="/acceso" state={{ desde: ubicacion }} replace />;
  }

  return <Outlet />;
}

/** Exige que la prueba o la suscripción estén vigentes. */
function RutaConPlan() {
  const { usuario } = useSesion();

  if (!usuario?.estado.permiteAcceso) {
    return <Navigate to="/facturacion" replace />;
  }

  return <Outlet />;
}

/** Exige rol de administrador. */
function SoloAdmin({ children }: { children: ReactNode }) {
  const { usuario } = useSesion();

  if (usuario?.rol !== 'admin') {
    return <Navigate to="/proyectos" replace />;
  }

  return children;
}

/** Páginas públicas que no deben verse con la sesión iniciada. */
function RutaInvitados({ children }: { children: ReactNode }) {
  const { usuario, cargando } = useSesion();

  if (cargando) {
    return <p className="sesion-cargando">Cargando…</p>;
  }

  if (usuario) {
    return <Navigate to="/proyectos" replace />;
  }

  return children;
}

export default function App() {
  return (
    <SesionProveedor>
      <div className="fondo-plano" aria-hidden="true">
        <PulsosPlano />
      </div>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route
          path="/acceso"
          element={
            <RutaInvitados>
              <Acceso />
            </RutaInvitados>
          }
        />
        <Route
          path="/registro"
          element={
            <RutaInvitados>
              <Registro />
            </RutaInvitados>
          }
        />
        <Route element={<RutaProtegida />}>
          <Route element={<Estructura />}>
            <Route path="/facturacion" element={<Facturacion />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route
              path="/admin/usuarios"
              element={
                <SoloAdmin>
                  <AdminUsuarios />
                </SoloAdmin>
              }
            />
            <Route element={<RutaConPlan />}>
              <Route path="/proyectos" element={<Proyectos />} />
              <Route path="/nuevo-proyecto" element={<NuevoProyecto />} />
              <Route path="/proyectos/:id" element={<EditorPlano />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SesionProveedor>
  );
}
