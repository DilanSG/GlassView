import type { Request, Response } from 'express';
import { variablesEntorno } from '../config/variablesEntorno.js';
import { crearToken } from '../services/token.js';

/**
 * Verifica el PIN compartido y devuelve un token de acceso firmado.
 */
export function verificarPinYDevolverToken(req: Request, res: Response): void {
  const { pin } = req.body ?? {};

  if (!pin || pin !== variablesEntorno.accessCode) {
    res.status(401).json({
      exito: false,
      datos: null,
      mensaje: 'PIN incorrecto.',
    });
    return;
  }

  const token = crearToken(pin);
  res.json({
    exito: true,
    datos: { token },
    mensaje: 'Acceso concedido.',
  });
}