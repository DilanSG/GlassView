import type { DatosPiezaPersonalizada, PiezaPersonalizada } from '../tipos';
import { peticion } from './http';

export async function listarPiezasPersonalizadas(): Promise<PiezaPersonalizada[]> {
  const respuesta = await peticion<PiezaPersonalizada[]>('/piezas-personalizadas');
  return respuesta.datos;
}

export async function crearPiezaPersonalizada(
  datos: DatosPiezaPersonalizada,
): Promise<PiezaPersonalizada> {
  const respuesta = await peticion<PiezaPersonalizada>('/piezas-personalizadas', {
    method: 'POST',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function actualizarPiezaPersonalizada(
  id: string,
  datos: Partial<DatosPiezaPersonalizada>,
): Promise<PiezaPersonalizada> {
  const respuesta = await peticion<PiezaPersonalizada>(`/piezas-personalizadas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos),
  });
  return respuesta.datos;
}

export async function eliminarPiezaPersonalizada(id: string): Promise<void> {
  await peticion<null>(`/piezas-personalizadas/${id}`, { method: 'DELETE' });
}
