import { createHmac, timingSafeEqual } from 'node:crypto';
import { variablesEntorno } from '../config/variablesEntorno.js';

const SEPARADOR = '.';
const DIAS_SESION = 30;

/**
 * Crea un token firmado con HMAC que contiene el id del usuario y la fecha
 * de expiración. El token viaja en las peticiones para autenticar la sesión.
 */
export function crearToken(usuarioId: string): string {
  const expiraEn = Date.now() + DIAS_SESION * 24 * 60 * 60 * 1000;
  const contenido = `${usuarioId}${SEPARADOR}${expiraEn}`;
  const firma = firmar(contenido);
  return `${contenido}${SEPARADOR}${firma}`;
}

/**
 * Verifica que el token sea válido (firma correcta y sin expirar) y devuelve
 * el id del usuario; `null` si el token no sirve.
 */
export function verificarToken(token: string | undefined): string | null {
  if (!token) {
    return null;
  }

  const partes = token.split(SEPARADOR);
  if (partes.length !== 3) {
    return null;
  }

  const [usuarioId, expiracion, firmaRecibida] = partes;
  const contenido = `${usuarioId}${SEPARADOR}${expiracion}`;
  const firmaEsperada = firmar(contenido);

  if (!firmasIguales(firmaRecibida, firmaEsperada)) {
    return null;
  }

  const expiraEnNumero = Number(expiracion);
  if (Number.isNaN(expiraEnNumero) || Date.now() > expiraEnNumero) {
    return null;
  }

  return usuarioId;
}

function firmar(contenido: string): string {
  return createHmac('sha256', variablesEntorno.secretoToken)
    .update(contenido)
    .digest('hex');
}

function firmasIguales(firmaA: string, firmaB: string): boolean {
  const bufferA = Buffer.from(firmaA);
  const bufferB = Buffer.from(firmaB);
  return bufferA.length === bufferB.length && timingSafeEqual(bufferA, bufferB);
}
