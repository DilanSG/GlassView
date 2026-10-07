import type { DatosUsuarioAdmin, Usuario } from '../tipos';
import { peticion } from './http';

interface SesionIniciada {
  token: string;
  usuario: Usuario;
}

export async function registrarse(datos: {
  nombre: string;
  email: string;
  contrasena: string;
}): Promise<SesionIniciada> {
  const respuesta = await peticion<SesionIniciada>('/auth/registro', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function iniciarSesion(email: string, contrasena: string): Promise<SesionIniciada> {
  const respuesta = await peticion<SesionIniciada>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, contrasena }),
  });
  return respuesta.datos;
}

export async function obtenerPerfil(): Promise<Usuario> {
  const respuesta = await peticion<Usuario>('/auth/perfil');
  return respuesta.datos;
}

export async function actualizarPerfil(datos: {
  nombre: string;
  email: string;
}): Promise<Usuario> {
  const respuesta = await peticion<Usuario>('/auth/perfil', {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function cambiarContrasena(
  contrasenaActual: string,
  contrasenaNueva: string,
): Promise<void> {
  await peticion<null>('/auth/contrasena', {
    method: 'PUT',
    body: JSON.stringify({ contrasenaActual, contrasenaNueva }),
  });
}

/** Marca el tutorial de bienvenida como visto y devuelve el perfil actualizado. */
export async function marcarTutorialVisto(): Promise<Usuario> {
  const respuesta = await peticion<Usuario>('/auth/tutorial', { method: 'PUT' });
  return respuesta.datos;
}

export async function eliminarCuenta(): Promise<void> {
  await peticion<null>('/auth/cuenta', { method: 'DELETE' });
}

export async function listarUsuarios(): Promise<Usuario[]> {
  const respuesta = await peticion<Usuario[]>('/auth/usuarios');
  return respuesta.datos;
}

export async function crearUsuario(datos: DatosUsuarioAdmin): Promise<Usuario> {
  const respuesta = await peticion<Usuario>('/auth/usuarios', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarUsuario(
  id: string,
  datos: DatosUsuarioAdmin,
): Promise<Usuario> {
  const respuesta = await peticion<Usuario>(`/auth/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function eliminarUsuario(id: string): Promise<void> {
  await peticion<null>(`/auth/usuarios/${id}`, { method: 'DELETE' });
}
