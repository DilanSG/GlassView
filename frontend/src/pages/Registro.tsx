import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registrarse } from '../api/clienteApi';
import PieDePagina from '../components/PieDePagina';
import { useSesion } from '../contextos/SesionContexto';

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setError('');

    if (contrasena !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const sesion = await registrarse({ nombre, email, contrasena });
      iniciarSesion(sesion.usuario, sesion.token);
      navegar('/proyectos', { replace: true });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo crear la cuenta.');
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
          <h1>Crea tu cuenta</h1>
          <p>Incluye 10 días de prueba con todas las funciones. Sin tarjeta.</p>

          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            autoFocus
            required
          />

          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(evento) => setEmail(evento.target.value)}
            placeholder="tucorreo@ejemplo.com"
            autoComplete="email"
            required
          />

          <label htmlFor="contrasena">Contraseña</label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label htmlFor="confirmacion">Repite la contraseña</label>
          <input
            id="confirmacion"
            type="password"
            value={confirmacion}
            onChange={(evento) => setConfirmacion(evento.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            required
          />

          {error && <p className="mensaje-error">{error}</p>}

          <button type="submit" className="boton-cta boton-cta-ancho" disabled={cargando}>
            {cargando ? 'Creando cuenta…' : 'Empezar prueba gratis'}
          </button>

          <p className="enlace-secundario">
            ¿Ya tienes cuenta? <Link to="/acceso">Inicia sesión</Link>
          </p>
        </form>
      </div>
      <PieDePagina />
    </div>
  );
}
