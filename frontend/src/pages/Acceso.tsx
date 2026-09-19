import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { iniciarSesion } from '../api/clienteApi';
import PieDePagina from '../components/PieDePagina';
import { useSesion } from '../contextos/SesionContexto';

export default function Acceso() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const { iniciarSesion: guardarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino =
    (ubicacion.state as { desde?: { pathname?: string } } | null)?.desde?.pathname ?? '/proyectos';

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setCargando(true);
    setError('');

    try {
      const sesion = await iniciarSesion(email, contrasena);
      guardarSesion(sesion.usuario, sesion.token);
      navegar(destino, { replace: true });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantalla-acceso">
      <div className="columna-acceso">
        <Link to="/" className="enlace-volver">
          ← Volver al inicio
        </Link>

        <form className="tarjeta-acceso" onSubmit={manejarEnvio}>
          <img src="/icono.png" alt="" className="acceso-icono" />
          <h1>GlassView</h1>
          <p>Inicia sesión para continuar con tus planos</p>

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            autoFocus
            required
          />

          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            placeholder="Tu contraseña"
            autoComplete="current-password"
            required
          />

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" className="boton-cta boton-cta-ancho" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Entrar'}
          </button>

          <p className="enlace-secundario">
            ¿No tienes cuenta? <Link to="/registro">Crea una gratis</Link>
          </p>
        </form>
      </div>
      <PieDePagina />
    </div>
  );
}
