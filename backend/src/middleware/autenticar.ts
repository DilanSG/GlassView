import type { NextFunction, Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { isValidObjectId } from 'mongoose';
import { Usuario, type Usuario as TipoUsuario } from '../models/Usuario.js';
import { verificarToken } from '../services/token.js';

declare global {
  namespace Express {
    interface Request {
      usuario?: HydratedDocument<TipoUsuario>;
    }
  }
}

/**
 * Middleware de sesión: valida el token, carga el usuario de la base de datos
 * y lo deja disponible en `req.usuario`.
 */
export async function autenticar(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.header('x-token-acceso');
  const usuarioId = verificarToken(token);

  if (!usuarioId || !isValidObjectId(usuarioId)) {
    res.status(401).json({
      exito: false,
      datos: null,
      mensaje: 'Sesión no válida o expirada. Inicia sesión de nuevo.',
      codigo: 'SESION_INVALIDA',
    });
    return;
  }

  const usuario = await Usuario.findById(usuarioId);

  if (!usuario) {
    res.status(401).json({
      exito: false,
      datos: null,
      mensaje: 'Sesión no válida o expirada. Inicia sesión de nuevo.',
      codigo: 'SESION_INVALIDA',
    });
    return;
  }

  if (!usuario.activo) {
    res.status(403).json({
      exito: false,
      datos: null,
      mensaje: 'Tu cuenta está bloqueada. Contacta con soporte de GlassView.',
      codigo: 'CUENTA_BLOQUEADA',
    });
    return;
  }

  req.usuario = usuario;
  next();
}
