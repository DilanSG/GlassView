import type { NextFunction, Request, Response } from 'express';

/** Middleware de rol: solo permite el paso a administradores. */
export function soloAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.usuario?.rol !== 'admin') {
    res.status(403).json({
      exito: false,
      datos: null,
      mensaje: 'No tienes permisos de administrador.',
      codigo: 'PERMISOS_INSUFICIENTES',
    });
    return;
  }

  next();
}
