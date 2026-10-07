const CLAVE_TOKEN = 'glassview-token';
const BASE_URL = import.meta.env.VITE_API_URL ?? '';
const RUTA_ACCESO = '/acceso';
const RUTAS_PUBLICAS = ['/auth/registro', '/auth/login', '/facturacion/precio'];

export interface RespuestaApi<T> {
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
export async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<RespuestaApi<T>> {
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
