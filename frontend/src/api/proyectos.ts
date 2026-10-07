import type { Proyecto } from '../tipos';
import { peticion } from './http';

export async function obtenerProyectos(): Promise<Proyecto[]> {
  const respuesta = await peticion<Proyecto[]>('/proyectos');
  return respuesta.datos;
}

export async function obtenerProyecto(id: string): Promise<Proyecto> {
  const respuesta = await peticion<Proyecto>(`/proyectos/${id}`);
  return respuesta.datos;
}

export async function crearProyecto(datos: Partial<Proyecto>): Promise<Proyecto> {
  const respuesta = await peticion<Proyecto>('/proyectos', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarProyecto(id: string, datos: Partial<Proyecto>): Promise<Proyecto> {
  const respuesta = await peticion<Proyecto>(`/proyectos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function eliminarProyecto(id: string): Promise<Proyecto> {
  const respuesta = await peticion<Proyecto>(`/proyectos/${id}`, {
    method: 'DELETE',
  });
  return respuesta.datos;
}
