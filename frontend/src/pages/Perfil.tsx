import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  actualizarPerfil,
  cambiarContrasena,
  eliminarCuenta,
} from '../api/clienteApi';
import { useSesion } from '../contextos/SesionContexto';
import type { Usuario } from '../tipos';
import { formatearFecha } from '../utils/formato';

function etiquetaEstado(usuario: Usuario): string {
  switch (usuario.estado.motivo) {
    case 'suscripcion':
      return 'Plan activo';
    case 'prueba':
      return `Prueba · ${usuario.estado.diasPruebaRestantes} días`;
    case 'expirado':
      return 'Prueba terminada';
    case 'bloqueado':
      return 'Cuenta bloqueada';
  }
}

export default function Perfil() {
  const { usuario, actualizarUsuario, cerrarSesion } = useSesion();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [mensajeDatos, setMensajeDatos] = useState('');
  const [errorDatos, setErrorDatos] = useState('');

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [guardandoContrasena, setGuardandoContrasena] = useState(false);
  const [mensajeContrasena, setMensajeContrasena] = useState('');
  const [errorContrasena, setErrorContrasena] = useState('');

  const [eliminando, setEliminando] = useState(false);

  useEffect(() => {
    setNombre(usuario?.nombre ?? '');
    setEmail(usuario?.email ?? '');
  }, [usuario?.nombre, usuario?.email]);

  if (!usuario) {
    return null;
  }

  const inicial = usuario.nombre.trim().charAt(0).toUpperCase() || '?';

  async function manejarDatos(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setGuardandoDatos(true);
    setMensajeDatos('');
    setErrorDatos('');
    try {
      actualizarUsuario(await actualizarPerfil({ nombre, email }));
      setMensajeDatos('Perfil actualizado.');
    } catch (causa) {
      setErrorDatos(causa instanceof Error ? causa.message : 'No se pudo actualizar el perfil.');
    } finally {
      setGuardandoDatos(false);
    }
  }

  async function manejarContrasena(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setMensajeContrasena('');
    setErrorContrasena('');

    if (contrasenaNueva !== confirmacion) {
      setErrorContrasena('Las contraseñas nuevas no coinciden.');
      return;
    }

    setGuardandoContrasena(true);
    try {
      await cambiarContrasena(contrasenaActual, contrasenaNueva);
      setContrasenaActual('');
      setContrasenaNueva('');
      setConfirmacion('');
      setMensajeContrasena('Contraseña actualizada.');
    } catch (causa) {
      setErrorContrasena(causa instanceof Error ? causa.message : 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardandoContrasena(false);
    }
  }

  async function manejarEliminacion(): Promise<void> {
    const confirmado = window.confirm(
      '¿Eliminar tu cuenta? Se borrarán también todos tus proyectos. Esta acción no se puede deshacer.',
    );
    if (!confirmado) {
      return;
    }

    setEliminando(true);
    try {
      await eliminarCuenta();
      cerrarSesion();
    } catch (causa) {
      setEliminando(false);
      window.alert(causa instanceof Error ? causa.message : 'No se pudo eliminar la cuenta.');
    }
  }

  return (
    <div className="pantalla pantalla-angosta">
      <header className="pagina-cabecera">
        <h2>Mi perfil</h2>
        <p>Gestiona tus datos personales y la seguridad de tu cuenta.</p>
      </header>

      <div className="panel-perfil">
        <section className="perfil-identidad">
          <span className="perfil-avatar">{inicial}</span>

          <div className="perfil-identidad-datos">
            <h3>{usuario.nombre}</h3>
            <p>
              {usuario.email} · Miembro desde {formatearFecha(usuario.fechaRegistro)}
            </p>
          </div>

          <div className="perfil-identidad-acciones">
            <span className={`chip-plan chip-plan-${usuario.estado.motivo}`}>
              {etiquetaEstado(usuario)}
            </span>
            {usuario.rol === 'admin' && <span className="chip-rol">Administrador</span>}
            <Link to="/facturacion" className="boton-secundario boton-publico">
              Gestionar plan
            </Link>
          </div>
        </section>

        <section className="panel-seccion">
          <header className="panel-seccion-cabecera">
            <h3>Datos personales</h3>
            <p>Actualiza tu nombre y el correo con el que accedes.</p>
          </header>

          <form onSubmit={manejarDatos}>
            <div className="rejilla-campos">
              <div className="campo">
                <label htmlFor="perfil-nombre">Nombre</label>
                <input
                  id="perfil-nombre"
                  type="text"
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="perfil-email">Correo electrónico</label>
                <input
                  id="perfil-email"
                  type="email"
                  value={email}
                  onChange={(evento) => setEmail(evento.target.value)}
                  required
                />
              </div>
            </div>

            {mensajeDatos && <p className="mensaje-exito">{mensajeDatos}</p>}
            {errorDatos && <p className="mensaje-error">{errorDatos}</p>}

            <div className="seccion-acciones">
              <button type="submit" className="boton-cta" disabled={guardandoDatos}>
                {guardandoDatos ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel-seccion">
          <header className="panel-seccion-cabecera">
            <h3>Seguridad</h3>
            <p>Cambia tu contraseña cuando lo necesites.</p>
          </header>

          <form onSubmit={manejarContrasena}>
            <div className="rejilla-campos">
              <div className="campo">
                <label htmlFor="contrasena-actual">Contraseña actual</label>
                <input
                  id="contrasena-actual"
                  type="password"
                  value={contrasenaActual}
                  onChange={(evento) => setContrasenaActual(evento.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="contrasena-nueva">Nueva contraseña</label>
                <input
                  id="contrasena-nueva"
                  type="password"
                  value={contrasenaNueva}
                  onChange={(evento) => setContrasenaNueva(evento.target.value)}
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>

              <div className="campo">
                <label htmlFor="contrasena-confirmar">Repite la nueva contraseña</label>
                <input
                  id="contrasena-confirmar"
                  type="password"
                  value={confirmacion}
                  onChange={(evento) => setConfirmacion(evento.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {mensajeContrasena && <p className="mensaje-exito">{mensajeContrasena}</p>}
            {errorContrasena && <p className="mensaje-error">{errorContrasena}</p>}

            <div className="seccion-acciones">
              <button type="submit" className="boton-cta" disabled={guardandoContrasena}>
                {guardandoContrasena ? 'Cambiando…' : 'Cambiar contraseña'}
              </button>
            </div>
          </form>
        </section>

        <section className="panel-seccion panel-seccion-peligro">
          <header className="panel-seccion-cabecera">
            <h3>Eliminar cuenta</h3>
            <p>
              Se borrarán tu cuenta y todos tus proyectos de forma permanente. Esta acción no se
              puede deshacer.
            </p>
          </header>

          <button
            type="button"
            className="boton-peligro-suave"
            onClick={manejarEliminacion}
            disabled={eliminando}
          >
            {eliminando ? 'Eliminando…' : 'Eliminar cuenta'}
          </button>
        </section>
      </div>
    </div>
  );
}
