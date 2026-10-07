import type {
  DespiecePiezas,
  ModeloVentaneria,
  PerfilVentaneria,
  PiezaPlano,
} from '../tipos';
import { peticion } from './http';

export async function obtenerCatalogoVentaneria(): Promise<ModeloVentaneria[]> {
  const respuesta = await peticion<ModeloVentaneria[]>('/catalogo-ventaneria');
  return respuesta.datos;
}

export async function obtenerPerfilesVentaneria(): Promise<PerfilVentaneria[]> {
  const respuesta = await peticion<PerfilVentaneria[]>('/catalogo-ventaneria/perfiles');
  return respuesta.datos;
}

export async function calcularDespiecePiezas(piezas: PiezaPlano[]): Promise<DespiecePiezas> {
  const respuesta = await peticion<DespiecePiezas>('/catalogo-ventaneria/despiece-piezas', {
    method: 'POST',
    body: JSON.stringify({ piezas }),
  });
  return respuesta.datos;
}

export async function generarPiezasPreset(
  modeloId: string,
  anchoCm: number,
  altoCm: number,
): Promise<PiezaPlano[]> {
  const respuesta = await peticion<PiezaPlano[]>('/catalogo-ventaneria/preset', {
    method: 'POST',
    body: JSON.stringify({ modeloId, anchoCm, altoCm }),
  });
  return respuesta.datos;
}
