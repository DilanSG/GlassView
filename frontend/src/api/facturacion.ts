import type { PrecioSuscripcion, Usuario } from '../tipos';
import { peticion } from './http';

export async function obtenerPrecioSuscripcion(pais?: string): Promise<PrecioSuscripcion> {
  const consulta = pais ? `?pais=${encodeURIComponent(pais)}` : '';
  const respuesta = await peticion<PrecioSuscripcion>(`/facturacion/precio${consulta}`);
  return respuesta.datos;
}

export async function pagarSuscripcion(pais?: string): Promise<Usuario> {
  const respuesta = await peticion<Usuario>('/facturacion/pagar', {
    method: 'POST',
    body: JSON.stringify({ pais }),
  });
  return respuesta.datos;
}
