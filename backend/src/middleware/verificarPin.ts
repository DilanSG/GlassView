import type { Request, Response, NextFunction } from 'express';
import { verificarToken } from '../services/token.js';

const CABECERA_TOKEN = 'x-token-acceso';

/**
 * Middleware de autenticación: rechaza las peticiones sin un token válido.
 */
export function verificarPin(req: Request, res: Response, next: NextFunction): void {
  const token = req.header(CABECERA_TOKEN);

  if (!verificarToken(token)) {
    res.status(401).json({
      exito: false,
      datos: null,
      mensaje: 'Acceso no autorizado: PIN no válido o sesión expirada.',
    });
    return;
  }

  next();
}
