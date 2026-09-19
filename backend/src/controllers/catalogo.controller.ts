import type { Request, Response } from 'express';
import {
  calcularDespieceVentaneria,
  obtenerModeloVentaneria,
  obtenerModelosParaPaleta,
} from '../services/catalogoVentaneria.js';
import {
  calcularDespiecePiezas,
  generarPiezasPreset,
} from '../services/despiecePiezas.js';
import { perfilesVentaneria } from '../services/perfilesVentaneria.js';

export function obtenerCatalogo(_req: Request, res: Response): void {
  try {
    res.json({
      exito: true,
      datos: obtenerModelosParaPaleta(),
      mensaje: 'Catálogo de ventanería cargado.',
    });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al cargar el catálogo.' });
  }
}

export function obtenerPerfiles(_req: Request, res: Response): void {
  try {
    res.json({
      exito: true,
      datos: perfilesVentaneria,
      mensaje: 'Perfiles cargados.',
    });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al cargar los perfiles.' });
  }
}

export function calcularDespiece(req: Request, res: Response): void {
  try {
    const { modeloId, anchoCm, altoCm } = req.body as {
      modeloId?: string;
      anchoCm?: number;
      altoCm?: number;
    };

    if (
      typeof modeloId !== 'string' ||
      typeof anchoCm !== 'number' ||
      typeof altoCm !== 'number' ||
      anchoCm <= 0 ||
      altoCm <= 0
    ) {
      res.status(400).json({
        exito: false,
        datos: null,
        mensaje: 'Parámetros no válidos: se requiere modeloId, anchoCm y altoCm.',
      });
      return;
    }

    const modelo = obtenerModeloVentaneria(modeloId);
    if (!modelo) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Modelo no encontrado.' });
      return;
    }

    res.json({
      exito: true,
      datos: calcularDespieceVentaneria(modelo, anchoCm, altoCm),
      mensaje: 'Despiece calculado.',
    });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al calcular el despiece.' });
  }
}

export function calcularDespiecePorPiezas(req: Request, res: Response): void {
  try {
    const piezas = (req.body as { piezas?: unknown[] }).piezas;
    if (!Array.isArray(piezas)) {
      res.status(400).json({ exito: false, datos: null, mensaje: 'Se requiere el arreglo piezas.' });
      return;
    }
    res.json({
      exito: true,
      datos: calcularDespiecePiezas(piezas as Parameters<typeof calcularDespiecePiezas>[0]),
      mensaje: 'Despiece por piezas calculado.',
    });
  } catch {
    res
      .status(500)
      .json({ exito: false, datos: null, mensaje: 'Error al calcular el despiece por piezas.' });
  }
}

export function generarPreset(req: Request, res: Response): void {
  try {
    const { modeloId, anchoCm, altoCm } = req.body as {
      modeloId?: string;
      anchoCm?: number;
      altoCm?: number;
    };
    if (
      typeof modeloId !== 'string' ||
      typeof anchoCm !== 'number' ||
      typeof altoCm !== 'number' ||
      anchoCm <= 0 ||
      altoCm <= 0
    ) {
      res.status(400).json({
        exito: false,
        datos: null,
        mensaje: 'Parámetros no válidos: se requiere modeloId, anchoCm y altoCm.',
      });
      return;
    }
    const piezas = generarPiezasPreset(modeloId, anchoCm, altoCm);
    res.json({ exito: true, datos: piezas, mensaje: 'Preset generado.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al generar el preset.' });
  }
}