import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { actualizarPerfil, cambiarContrasena, eliminarCuenta } from '../api/clienteApi';
import { useConfirmacion } from '../componentes/dialogos/ConfirmacionContexto';
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

function descripcionPlan(usuario: Usuario): string {
  switch (usuario.estado.motivo) {
    case 'suscripcion':
      return usuario.estado.suscripcionHasta
        ? `Suscripción activa hasta el ${formatearFecha(usuario.estado.suscripcionHasta)}. Incluye planos ilimitados, despiece y PDF.`
        : 'Suscripción activa: planos ilimitados, despiece y PDF.';
    case 'prueba':
      return `Prueba gratuita hasta el ${formatearFecha(usuario.estado.pruebaHasta)}. Al terminar, activa el plan para seguir dibujando.`;
    case 'expirado':
      return `La prueba terminó el ${formatearFecha(usuario.estado.pruebaHasta)}. Activa el plan para volver a dibujar planos.`;
    case 'bloqueado':
      return 'La cuenta está bloqueada. Activa la suscripción para recuperar el acceso.';
  }
}

export default function Perfil() {
  const { usuario, actualizarUsuario, cerrarSesion } = useSesion();
  const confirmar = useConfirmacion();

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
  const [errorEliminar, setErrorEliminar] = useState('');

  useEffect(() => {
    setNombre(usuario?.nombre ?? '');
    setEmail(usuario?.email ?? '');
  }, [usuario?.nombre, usuario?.email]);

  // Avance de la prueba gratuita para la barra del plan.
  const progresoPrueba = useMemo(() => {
    if (!usuario) return null;
    const inicio = usuario.fechaRegistro ? new Date(usuario.fechaRegistro).getTime() : null;
    const fin = new Date(usuario.estado.pruebaHasta).getTime();
    if (!inicio || !Number.isFinite(fin) || fin <= inicio) return null;
    const total = Math.max(1, Math.round((fin - inicio) / 86400000));
    const restantes = Math.max(0, Math.min(total, usuario.estado.diasPruebaRestantes));
    return {
      total,
      restantes,
      porcentaje: Math.min(100, Math.round(((total - restantes) / total) * 100)),
    };
  }, [usuario]);

  if (!usuario) {
    return null;
  }

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
      setErrorContrasena(
        causa instanceof Error ? causa.message : 'No se pudo cambiar la contraseña.',
      );
    } finally {
      setGuardandoContrasena(false);
    }
  }

  async function manejarEliminacion(): Promise<void> {
    const confirmado = await confirmar({
      titulo: 'Eliminar la cuenta',
      mensaje:
        'Se borrarán tu cuenta y todos tus proyectos de forma permanente. Esta acción no se puede deshacer.',
      textoConfirmar: 'Eliminar cuenta',
      peligro: true,
      textoExigido: usuario?.email,
    });
    if (!confirmado) {
      return;
    }

    setEliminando(true);
    setErrorEliminar('');
    try {
      await eliminarCuenta();
      cerrarSesion();
    } catch (causa) {
      setEliminando(false);
      setErrorEliminar(
        causa instanceof Error ? causa.message : 'No se pudo eliminar la cuenta.',
      );
    }
  }

  return (
    <div className="pantalla pantalla-angosta">
      <header className="pagina-cabecera">
        <h2>Perfil</h2>
        <p>
          Consulta el estado de la cuenta y del plan, y actualiza tus datos o tu contraseña.
        </p>
      </header>

      <div className="perfil-distribucion">
        <div className="perfil-columna">
          <section className="tarjeta-perfil">
            <header className="tarjeta-perfil-cabecera">
              <h3>Cuenta</h3>
              {usuario.rol === 'admin' && <span className="chip-rol">Administrador</span>}
            </header>
            <dl className="cuenta-datos">
              <div>
                <dt>Nombre</dt>
                <dd>{usuario.nombre}</dd>
              </div>
              <div>
                <dt>Correo</dt>
                <dd>{usuario.email}</dd>
              </div>
              <div>
                <dt>Miembro desde</dt>
                <dd>{usuario.fechaRegistro ? formatearFecha(usuario.fechaRegistro) : '—'}</dd>
              </div>
            </dl>
          </section>

          <section className="tarjeta-perfil tarjeta-plan">
            <header className="tarjeta-perfil-cabecera">
              <h3>Plan</h3>
              <span className={`chip-plan chip-plan-${usuario.estado.motivo}`}>
                {etiquetaEstado(usuario)}
              </span>
            </header>

            <p className="plan-descripcion">{descripcionPlan(usuario)}</p>

            {usuario.estado.motivo === 'prueba' && progresoPrueba && (
              <>
                <div
                  className="plan-progreso"
                  role="img"
                  aria-label={`${progresoPrueba.restantes} de ${progresoPrueba.total} días de prueba restantes`}
                >
                  <span style={{ width: `${progresoPrueba.porcentaje}%` }} />
                </div>
                <p className="plan-detalle">
                  {progresoPrueba.restantes} de {progresoPrueba.total} días de prueba restantes
                </p>
              </>
            )}

            <Link to="/facturacion" className="boton-cta boton-ancho">
              {usuario.estado.motivo === 'suscripcion' ? 'Gestionar plan' : 'Activar plan'}
            </Link>
          </section>
        </div>

        <div className="perfil-columna">
          <section className="tarjeta-perfil">
            <header className="tarjeta-perfil-cabecera">
              <h3>Datos personales</h3>
            </header>
            <p className="tarjeta-perfil-ayuda">
              Actualiza tu nombre y el correo con el que accedes.
            </p>

            <form onSubmit={manejarDatos} className="formulario-perfil">
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

          <section className="tarjeta-perfil">
            <header className="tarjeta-perfil-cabecera">
              <h3>Seguridad</h3>
            </header>
            <p className="tarjeta-perfil-ayuda">Cambia tu contraseña cuando lo necesites.</p>

            <form onSubmit={manejarContrasena} className="formulario-perfil">
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
        </div>
      </div>

      <section className="tarjeta-perfil tarjeta-peligro">
        <div>
          <h3>Eliminar cuenta</h3>
          <p>
            Se borrarán tu cuenta y todos tus proyectos de forma permanente. Esta acción no se
            puede deshacer.
          </p>
          {errorEliminar && <p className="mensaje-error">{errorEliminar}</p>}
        </div>
        <button
          type="button"
          className="boton-peligro-suave"
          onClick={() => void manejarEliminacion()}
          disabled={eliminando}
        >
          {eliminando ? 'Eliminando…' : 'Eliminar cuenta'}
        </button>
      </section>
    </div>
  );
}
