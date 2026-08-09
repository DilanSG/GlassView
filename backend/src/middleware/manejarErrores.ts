import type { NextFunction, Request, Response } from 'express';

/**
 * Captura errores no controlados y responde con una respuesta JSON uniforme.
 */
export function manejarErrores(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('Error no controlado:', err);
  res.status(500).json({
    exito: false,
    datos: null,
    mensaje: 'Error interno del servidor.',
  });
}