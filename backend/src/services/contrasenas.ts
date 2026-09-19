import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
const LONGITUD_CLAVE = 64;

/**
 * Deriva la contraseña con scrypt y una sal aleatoria.
 * Formato almacenado: `sal:hash` (ambos en hexadecimal).
 */
export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16).toString('hex');
  const derivada = (await scryptAsync(contrasena, sal, LONGITUD_CLAVE)) as Buffer;
  return `${sal}:${derivada.toString('hex')}`;
}

/** Comprueba una contraseña contra el hash almacenado en tiempo constante. */
export async function verificarContrasena(contrasena: string, hash: string): Promise<boolean> {
  const [sal, esperada] = hash.split(':');
  if (!sal || !esperada) {
    return false;
  }

  const derivada = (await scryptAsync(contrasena, sal, LONGITUD_CLAVE)) as Buffer;
  const esperadaBuffer = Buffer.from(esperada, 'hex');

  return (
    derivada.length === esperadaBuffer.length && timingSafeEqual(derivada, esperadaBuffer)
  );
}
