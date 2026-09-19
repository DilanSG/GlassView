import type {
  DatosUsuarioAdmin,
  DespiecePiezas,
  DespieceVentaneria,
  ModeloVentaneria,
  PerfilVentaneria,
  PiezaPlano,
  PrecioSuscripcion,
  Proyecto,
  Usuario,
} from '../tipos';

const CLAVE_TOKEN = 'glassview-token';
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const RUTA_ACCESO = '/acceso';
const RUTAS_PUBLICAS = ['/auth/registro', '/auth/login', '/facturacion/precio'];

interface RespuestaApi<T> {
  exito: boolean;
  datos: T;
  mensaje: string;
  codigo?: string;
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
  return tokenVigente(obtenerToken());
}

/**
 * Comprueba la estructura y la fecha de expiración del token en el cliente.
 * La firma solo la puede validar el backend; si el token fue alterado o
 * revocado, la primera petición protegida responderá 401.
 */
function tokenVigente(token: string | null): boolean {
  if (!token) {
    return false;
  }
  const partes = token.split('.');
  if (partes.length !== 3) {
    return false;
  }
  const expiracion = Number(partes[1]);
  return Number.isFinite(expiracion) && Date.now() <= expiracion;
}

/** Borra la sesión y devuelve al usuario a la pantalla de acceso. */
function manejarSesionExpirada(): void {
  eliminarToken();
  if (window.location.pathname !== RUTA_ACCESO) {
    window.location.replace(RUTA_ACCESO);
  }
}

export class ErrorApi extends Error {
  estatusCodigo: number;
  codigo?: string;

  constructor(estatusCodigo: number, mensaje: string, codigo?: string) {
    super(mensaje);
    this.estatusCodigo = estatusCodigo;
    this.codigo = codigo;
  }
}

/**
 * Petición base: añade el token de sesión y parsea la respuesta uniforme del
 * backend. En las rutas públicas no redirige al acceso si falta la sesión.
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

  if (respuesta.status === 401 && !RUTAS_PUBLICAS.includes(ruta)) {
    manejarSesionExpirada();
  }

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
      cuerpo?.codigo,
    );
  }

  return cuerpo;
}

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

export async function eliminarCuenta(): Promise<void> {
  await peticion<null>('/auth/cuenta', { method: 'DELETE' });
}

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