import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorApi, registrarse } from '../api/clienteApi';
import { AlertaAuth, CampoAuth, CampoContrasena, IndicadorFuerza } from '../components/CamposAuth';
import PaginaAutenticacion from '../components/PaginaAutenticacion';
import { useSesion } from '../contextos/SesionContexto';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMO_CONTRASENA = 6;

export default function Registro() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<{
    nombre?: string;
    email?: string;
    contrasena?: string;
    confirmacion?: string;
  }>({});
  const [errorServidor, setErrorServidor] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useSesion();
  const navegar = useNavigate();

  const coinciden = confirmacion.length > 0 && confirmacion === contrasena;
  const discrepan = confirmacion.length > 0 && !coinciden;

  function limpiarError(campo: 'nombre' | 'email' | 'contrasena' | 'confirmacion'): void {
    setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
    setErrorServidor('');
  }

  function cambiarNombre(valor: string): void {
    setNombre(valor);
    limpiarError('nombre');
  }

  function cambiarEmail(valor: string): void {
    setEmail(valor);
    limpiarError('email');
  }

  function cambiarContrasena(valor: string): void {
    setContrasena(valor);
    limpiarError('contrasena');
  }

  function cambiarConfirmacion(valor: string): void {
    setConfirmacion(valor);
    limpiarError('confirmacion');
  }

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();

    const nuevosErrores: typeof errores = {};
    if (nombre.trim().length < 2) {
      nuevosErrores.nombre = 'Escribe tu nombre (mínimo 2 caracteres).';
    }
    if (!EMAIL_VALIDO.test(email.trim())) {
      nuevosErrores.email = 'Escribe un correo válido.';
    }
    if (contrasena.length < MINIMO_CONTRASENA) {
      nuevosErrores.contrasena = `Usa al menos ${MINIMO_CONTRASENA} caracteres.`;
    }
    if (confirmacion !== contrasena) {
      nuevosErrores.confirmacion = 'Las contraseñas no coinciden.';
    }
    setErrores(nuevosErrores);
    setErrorServidor('');
    if (Object.keys(nuevosErrores).length > 0) {
      return;
    }

    setCargando(true);
    try {
      const sesion = await registrarse({
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        contrasena,
      });
      iniciarSesion(sesion.usuario, sesion.token);
      navegar('/proyectos', { replace: true });
    } catch (causa) {
      if (causa instanceof ErrorApi && causa.estatusCodigo === 409) {
        setErrores({ email: 'Ya existe una cuenta con ese correo.' });
      } else {
        setErrorServidor(causa instanceof Error ? causa.message : 'No se pudo crear la cuenta.');
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <PaginaAutenticacion>
      <form className="tarjeta-auth" onSubmit={manejarEnvio} noValidate>
        <h1>Crea tu cuenta</h1>
        <p>Empieza con 10 días de prueba, sin tarjeta.</p>

        <CampoAuth
          id="nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambiar={cambiarNombre}
          error={errores.nombre}
          placeholder="Tu nombre y apellido"
          autoComplete="name"
          autoFocus
          required
        />

        <CampoAuth
          id="email"
          etiqueta="Correo electrónico"
          tipo="email"
          valor={email}
          onCambiar={cambiarEmail}
          error={errores.email}
          placeholder="tucorreo@ejemplo.com"
          autoComplete="email"
          required
        />

        <CampoContrasena
          id="contrasena"
          etiqueta="Contraseña"
          valor={contrasena}
          onCambiar={cambiarContrasena}
          error={errores.contrasena}
          placeholder={`Mínimo ${MINIMO_CONTRASENA} caracteres`}
          autoComplete="new-password"
          minLength={MINIMO_CONTRASENA}
          required
        >
          <IndicadorFuerza contrasena={contrasena} />
        </CampoContrasena>

        <CampoContrasena
          id="confirmacion"
          etiqueta="Repite la contraseña"
          valor={confirmacion}
          onCambiar={cambiarConfirmacion}
          error={errores.confirmacion ?? (discrepan ? 'Las contraseñas no coinciden.' : undefined)}
          exito={coinciden ? 'Las contraseñas coinciden.' : undefined}
          placeholder="Repite la contraseña"
          autoComplete="new-password"
          required
        />

        <AlertaAuth mensaje={errorServidor} />

        <button type="submit" className="boton-cta boton-cta-ancho" disabled={cargando}>
          {cargando ? 'Creando cuenta…' : 'Empezar prueba gratis'}
        </button>

        <p className="enlace-secundario">
          ¿Ya tienes cuenta? <Link to="/acceso">Inicia sesión</Link>
        </p>
      </form>
    </PaginaAutenticacion>
  );
}
