import type {
  DespiecePiezas,
  DespieceVentaneria,
  ModeloVentaneria,
  PerfilVentaneria,
  PiezaPlano,
  Proyecto,
} from '../tipos';

const CLAVE_TOKEN = 'glassview-token-acceso';
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

interface RespuestaApi<T> {
  exito: boolean;
  datos: T;
  mensaje: string;
}

export function obtenerToken(): string | null {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function guardarToken(token: string): void {
  localStorage.setItem(CLAVE_TOKEN, token);
}

export function eliminarToken(): void {
  localStorage.removeItem(CLAVE_TOKEN);
}

export function haySesionActiva(): boolean {
  return obtenerToken() !== null;
}

export class ErrorApi extends Error {
  estatusCodigo: number;

  constructor(estatusCodigo: number, mensaje: string) {
    super(mensaje);
    this.estatusCodigo = estatusCodigo;
  }
}

/**
 * Petición base: añade el token de acceso y parsea la respuesta uniforme del backend.
 */
async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<RespuestaApi<T>> {
  const cabeceras = new Headers(opciones.headers);
  cabeceras.set('Content-Type', 'application/json');

  const token = obtenerToken();
  if (token) {
    cabeceras.set('x-token-acceso', token);
  }

  const respuesta = await fetch(`${BASE_URL}/api${ruta}`, {
    ...opciones,
    headers: cabeceras,
  });

  const texto = await respuesta.text();
  let cuerpo: RespuestaApi<T> | null = null;
  try {
    cuerpo = JSON.parse(texto) as RespuestaApi<T>;
  } catch {
    cuerpo = null;
  }

  if (!respuesta.ok || !cuerpo?.exito) {
    throw new ErrorApi(
      respuesta.status,
      cuerpo?.mensaje ??
        'La API no respondió correctamente. Comprueba que VITE_API_URL apunte al backend (sin "/api" al final).',
    );
  }

  return cuerpo;
}

export async function verificarPin(pin: string): Promise<string> {
  const respuesta = await peticion<{ token: string }>('/auth/verificar-pin', {
    method: 'POST',
    body: JSON.stringify({ pin }),
  });
  return respuesta.datos.token;
}

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

export async function obtenerCatalogoVentaneria(): Promise<ModeloVentaneria[]> {
  const respuesta = await peticion<ModeloVentaneria[]>('/catalogo-ventaneria');
  return respuesta.datos;
}

export async function calcularDespieceVentanaria(
  modeloId: string,
  anchoCm: number,
  altoCm: number,
): Promise<DespieceVentaneria> {
  const respuesta = await peticion<DespieceVentaneria>('/catalogo-ventaneria/despiece', {
    method: 'POST',
    body: JSON.stringify({ modeloId, anchoCm, altoCm }),
  });
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