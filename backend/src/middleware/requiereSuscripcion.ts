import type { NextFunction, Request, Response } from 'express';
import { calcularEstadoAcceso } from '../services/suscripcion.js';

/**
 * Middleware de plan: bloquea las funciones de la aplicación cuando la prueba
 * terminó y la suscripción no está activa. Los administradores no se bloquean.
 */
export function requiereSuscripcion(req: Request, res: Response, next: NextFunction): void {
  const usuario = req.usuario;

  if (!usuario || usuario.rol === 'admin') {
    next();
    return;
  }

  const estado = calcularEstadoAcceso(usuario);

  if (!estado.permiteAcceso) {
    res.status(402).json({
      exito: false,
      datos: null,
      mensaje:
        'Tu prueba gratuita terminó. Activa tu suscripción para seguir creando planos.',
      codigo: 'SUSCRIPCION_REQUERIDA',
      estado,
    });
    return;
  }

  next();
}
