import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorApi, iniciarSesion } from '../api/clienteApi';
import { AlertaAuth, CampoAuth, CampoContrasena } from '../components/CamposAuth';
import PaginaAutenticacion from '../components/PaginaAutenticacion';
import { useSesion } from '../contextos/SesionContexto';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Acceso() {
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errores, setErrores] = useState<{ email?: string; contrasena?: string }>({});
  const [errorServidor, setErrorServidor] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion: guardarSesion } = useSesion();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const destino =
    (ubicacion.state as { desde?: { pathname?: string } } | null)?.desde?.pathname ?? '/proyectos';

  function cambiarEmail(valor: string): void {
    setEmail(valor);
    setErrores((actuales) => ({ ...actuales, email: undefined }));
    setErrorServidor('');
  }

  function cambiarContrasena(valor: string): void {
    setContrasena(valor);
    setErrores((actuales) => ({ ...actuales, contrasena: undefined }));
    setErrorServidor('');
  }

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (!EMAIL_VALIDO.test(email.trim())) {
      nuevosErrores.email = 'Escribe un correo válido.';
    }
    if (!contrasena) {
      nuevosErrores.contrasena = 'Escribe tu contraseña.';
    }
    setErrores(nuevosErrores);
    setErrorServidor('');
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    setCargando(true);
    try {
      const sesion = await iniciarSesion(email.trim().toLowerCase(), contrasena);
      guardarSesion(sesion.usuario, sesion.token);
      navegar(destino, { replace: true });
    } catch (causa) {
      if (causa instanceof ErrorApi && causa.estatusCodigo === 401) {
        setErrores({ contrasena: 'Correo o contraseña incorrectos.' });
      } else {
        setErrorServidor(causa instanceof Error ? causa.message : 'No se pudo iniciar sesión.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <PaginaAutenticacion>
      <form className="tarjeta-auth" onSubmit={manejarEnvio} noValidate>
        <h1>Inicia sesión</h1>
        <p>Accede con tu correo para retomar tus planos.</p>

        <CampoAuth
          id="email"
          etiqueta="Correo electrónico"
          tipo="email"
          valor={email}
          onCambiar={cambiarEmail}
          error={errores.email}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          autoFocus
          required
        />

        <CampoContrasena
          id="contrasena"
          etiqueta="Contraseña"
          valor={contrasena}
          onCambiar={cambiarContrasena}
          error={errores.contrasena}
          placeholder="Tu contraseña"
          autoComplete="current-password"
          required
        />

        <AlertaAuth mensaje={errorServidor} />

        <button type="submit" className="boton-cta boton-cta-ancho" disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>

        <p className="enlace-secundario">
          ¿No tienes cuenta? <Link to="/registro">Crea una gratis</Link>
        </p>
      </form>
    </PaginaAutenticacion>
  );
}
