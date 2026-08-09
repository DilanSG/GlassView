import { createHmac, timingSafeEqual } from 'node:crypto';
import { variablesEntorno } from '../config/variablesEntorno.js';

const SEPARADOR = '.';

/**
 * Crea un token firmado con HMAC que contiene el PIN y la fecha de expiración.
 * El token viaja en las peticiones del frontend para autenticar el acceso.
 */
export function crearToken(pin: string): string {
  const expiraEn = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const contenido = `${pin}${SEPARADOR}${expiraEn}`;
  const firma = firmar(contenido);
  return `${contenido}${SEPARADOR}${firma}`;
}

/**
 * Verifica que el token sea válido: firma correcta, PIN correcto y no expirado.
 */
export function verificarToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const partes = token.split(SEPARADOR);
  if (partes.length !== 3) {
    return false;
  }

  const [pin, expiracion, firmaRecibida] = partes;
  const contenido = `${pin}${SEPARADOR}${expiracion}`;
  const firmaEsperada = firmar(contenido);

  if (!firmasIguales(firmaRecibida, firmaEsperada)) {
    return false;
  }

  if (pin !== variablesEntorno.accessCode) {
    return false;
  }

  const expiraEnNumero = Number(expiracion);
  if (Number.isNaN(expiraEnNumero) || Date.now() > expiraEnNumero) {
    return false;
  }

  return true;
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
