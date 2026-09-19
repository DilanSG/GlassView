import { useEffect, useState, type FormEvent } from 'react';
import {
  actualizarUsuario,
  crearUsuario,
  eliminarUsuario,
  listarUsuarios,
} from '../api/clienteApi';
import { useSesion } from '../contextos/SesionContexto';
import type { DatosUsuarioAdmin, RolUsuario, Usuario } from '../tipos';
import { aFechaInput, formatearFecha } from '../utils/formato';

interface FormularioUsuario {
  id: string | null;
  nombre: string;
  email: string;
  contrasena: string;
  rol: RolUsuario;
  activo: boolean;
  pruebaHasta: string;
}

function fechaPruebaPorDefecto(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 10);
  return fecha.toISOString().slice(0, 10);
}

function etiquetaEstado(usuario: Usuario): string {
  switch (usuario.estado.motivo) {
    case 'suscripcion':
      return 'Suscripción activa';
    case 'prueba':
      return `Prueba · ${usuario.estado.diasPruebaRestantes} días`;
    case 'expirado':
      return 'Prueba terminada';
    case 'bloqueado':
      return 'Bloqueada';
  }
}

export default function AdminUsuarios() {
  const { usuario: usuarioActual } = useSesion();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [formulario, setFormulario] = useState<FormularioUsuario | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    void cargarUsuarios();
  }, []);

  async function cargarUsuarios(): Promise<void> {
    setCargando(true);
    setError('');
    try {
      setUsuarios(await listarUsuarios());
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudieron cargar los usuarios.');
    } finally {
      setCargando(false);
    }
  }

  function abrirCreacion(): void {
    setMensaje('');
    setError('');
    setFormulario({
      id: null,
      nombre: '',
      email: '',
      contrasena: '',
      rol: 'usuario',
      activo: true,
      pruebaHasta: fechaPruebaPorDefecto(),
    });
  }

  function abrirEdicion(usuario: Usuario): void {
    setMensaje('');
    setError('');
    setFormulario({
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email,
      contrasena: '',
      rol: usuario.rol,
      activo: usuario.activo,
      pruebaHasta: aFechaInput(usuario.pruebaHasta),
    });
  }

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (!formulario) {
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    const datos: DatosUsuarioAdmin = {
      nombre: formulario.nombre,
      email: formulario.email,
      rol: formulario.rol,
      activo: formulario.activo,
      pruebaHasta: new Date(`${formulario.pruebaHasta}T23:59:59`).toISOString(),
    };
    if (formulario.contrasena) {
      datos.contrasena = formulario.contrasena;
    }

    try {
      if (formulario.id) {
        await actualizarUsuario(formulario.id, datos);
        setMensaje('Usuario actualizado.');
      } else {
        await crearUsuario(datos);
        setMensaje('Usuario creado.');
      }
      setFormulario(null);
      await cargarUsuarios();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }

  async function manejarEliminacion(usuario: Usuario): Promise<void> {
    const confirmado = window.confirm(
      `¿Eliminar la cuenta de ${usuario.nombre}? Se borrarán también sus proyectos.`,
    );
    if (!confirmado) {
      return;
    }

    setError('');
    setMensaje('');
    try {
      await eliminarUsuario(usuario._id);
      setMensaje('Usuario eliminado.');
      await cargarUsuarios();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo eliminar el usuario.');
    }
  }

  return (
    <div className="pantalla">
      <section className="seccion-titulo">
        <h2>Administración de usuarios</h2>
        <button type="button" className="boton-cta boton-cta-pequeno" onClick={abrirCreacion}>
          Nuevo usuario
        </button>
      </section>

      {mensaje && (
        <div className="aviso aviso-exito" role="status">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="aviso aviso-error" role="alert">
          {error}
        </div>
      )}

      {formulario && (
        <form className="tarjeta-formulario formulario-usuario" onSubmit={manejarEnvio}>
          <h3>{formulario.id ? 'Editar usuario' : 'Crear usuario'}</h3>

          <div className="rejilla-formulario">
            <div className="campo">
              <label htmlFor="usuario-nombre">Nombre</label>
              <input
                id="usuario-nombre"
                type="text"
                value={formulario.nombre}
                onChange={(evento) =>
                  setFormulario({ ...formulario, nombre: evento.target.value })
                }
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="usuario-email">Correo</label>
              <input
                id="usuario-email"
                type="email"
                value={formulario.email}
                onChange={(evento) =>
                  setFormulario({ ...formulario, email: evento.target.value })
                }
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="usuario-contrasena">
                {formulario.id ? 'Nueva contraseña (opcional)' : 'Contraseña'}
              </label>
              <input
                id="usuario-contrasena"
                type="password"
                value={formulario.contrasena}
                onChange={(evento) =>
                  setFormulario({ ...formulario, contrasena: evento.target.value })
                }
                placeholder={formulario.id ? 'Dejar en blanco para no cambiar' : 'Mínimo 6 caracteres'}
                minLength={formulario.contrasena ? 6 : undefined}
                required={!formulario.id}
              />
            </div>

            <div className="campo">
              <label htmlFor="usuario-rol">Rol</label>
              <select
                id="usuario-rol"
                className="selector"
                value={formulario.rol}
                onChange={(evento) =>
                  setFormulario({ ...formulario, rol: evento.target.value as RolUsuario })
                }
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div className="campo">
              <label htmlFor="usuario-prueba">Prueba hasta</label>
              <input
                id="usuario-prueba"
                type="date"
                value={formulario.pruebaHasta}
                onChange={(evento) =>
                  setFormulario({ ...formulario, pruebaHasta: evento.target.value })
                }
                required
              />
            </div>

            <div className="campo campo-inline">
              <label htmlFor="usuario-activo">Cuenta activa</label>
              <input
                id="usuario-activo"
                type="checkbox"
                checked={formulario.activo}
                onChange={(evento) =>
                  setFormulario({ ...formulario, activo: evento.target.checked })
                }
              />
            </div>
          </div>

          <div className="acciones-formulario">
            <button
              type="button"
              className="boton-secundario"
              onClick={() => setFormulario(null)}
              disabled={guardando}
            >
              Cancelar
            </button>
            <button type="submit" className="boton-cta" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      )}

      {cargando ? (
        <p className="sin-datos">Cargando usuarios…</p>
      ) : (
        <div className="tabla-contenedor">
          <table className="tabla-datos">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Registro</th>
                <th>Prueba hasta</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario._id}>
                  <td>
                    {usuario.nombre}
                    {usuario._id === usuarioActual?._id && (
                      <span className="etiqueta-tu"> (tú)</span>
                    )}
                  </td>
                  <td>{usuario.email}</td>
                  <td>{usuario.rol === 'admin' ? 'Administrador' : 'Usuario'}</td>
                  <td>
                    <span className={`chip-plan chip-plan-${usuario.estado.motivo}`}>
                      {etiquetaEstado(usuario)}
                    </span>
                    {!usuario.activo && <span className="chip-plan chip-plan-bloqueado">Bloqueada</span>}
                  </td>
                  <td>{formatearFecha(usuario.fechaRegistro)}</td>
                  <td>{formatearFecha(usuario.pruebaHasta)}</td>
                  <td className="celda-acciones">
                    <button type="button" className="boton-tabla" onClick={() => abrirEdicion(usuario)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className="boton-tabla boton-tabla-peligro"
                      onClick={() => manejarEliminacion(usuario)}
                      disabled={usuario._id === usuarioActual?._id}
                      title={
                        usuario._id === usuarioActual?._id
                          ? 'No puedes eliminar tu propia cuenta'
                          : 'Eliminar usuario'
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {usuarios.length === 0 && <p className="sin-datos">No hay usuarios registrados.</p>}
        </div>
      )}

      <p className="nota-admin">
        Los proyectos de cada usuario son privados: ni siquiera el administrador puede verlos.
      </p>
    </div>
  );
}
