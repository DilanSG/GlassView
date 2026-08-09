import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Estructura from './components/Estructura';
import PulsosPlano from './components/PulsosPlano';
import Acceso from './pages/Acceso';
import EditorPlano from './pages/EditorPlano';
import NuevoProyecto from './pages/NuevoProyecto';
import Proyectos from './pages/Proyectos';
import { haySesionActiva } from './api/clienteApi';

function RutaProtegida({ children }: { children: React.ReactNode }) {
  const ubicacion = useLocation();

  if (!haySesionActiva()) {
    return <Navigate to="/acceso" state={{ desde: ubicacion }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <>
      <div className="fondo-plano" aria-hidden="true">
        <PulsosPlano />
      </div>
      <Routes>
        <Route path="/acceso" element={<Acceso />} />
        <Route
          element={
            <RutaProtegida>
              <Estructura />
            </RutaProtegida>
          }
        >
          <Route path="/proyectos" element={<Proyectos />} />
          <Route path="/nuevo-proyecto" element={<NuevoProyecto />} />
          <Route path="/proyectos/:id" element={<EditorPlano />} />
        </Route>
        <Route path="*" element={<Navigate to="/proyectos" replace />} />
      </Routes>
    </>
  );
}