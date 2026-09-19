import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  eliminarToken,
  guardarToken,
  haySesionActiva,
  obtenerPerfil,
} from '../api/clienteApi';
import type { Usuario } from '../tipos';

interface ValorSesion {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (usuario: Usuario, token: string) => void;
  cerrarSesion: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
  refrescar: () => Promise<void>;
}

const SesionContexto = createContext<ValorSesion | null>(null);

export function SesionProveedor({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  // Solo se arranca en estado de carga si hay un token guardado: así las
  // páginas públicas no parpadean con un «Cargando sesión…» innecesario.
  const [cargando, setCargando] = useState(() => haySesionActiva());
  const navegar = useNavigate();

  const refrescar = useCallback(async () => {
    if (!haySesionActiva()) {
      setUsuario(null);
      setCargando(false);
      return;
    }

    setCargando(true);
    try {
      setUsuario(await obtenerPerfil());
    } catch {
      // El token existe localmente pero el backend ya no lo acepta
      // (sesión revocada o cuenta eliminada): se limpia.
      eliminarToken();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  const iniciarSesion = useCallback((nuevoUsuario: Usuario, token: string) => {
    guardarToken(token);
    setUsuario(nuevoUsuario);
  }, []);

  const cerrarSesion = useCallback(() => {
    eliminarToken();
    setUsuario(null);
    navegar('/');
  }, [navegar]);

  const actualizarUsuario = useCallback((nuevoUsuario: Usuario) => {
    setUsuario(nuevoUsuario);
  }, []);

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, actualizarUsuario, refrescar }),
    [usuario, cargando, iniciarSesion, cerrarSesion, actualizarUsuario, refrescar],
  );

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion(): ValorSesion {
  const contexto = useContext(SesionContexto);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de SesionProveedor.');
  }
  return contexto;
}
