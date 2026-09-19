import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { Proyecto } from '../models/Proyecto.js';

/**
 * Los proyectos son privados: cada usuario solo accede a los suyos. Ningún
 * otro usuario (ni el administrador) puede verlos o modificarlos.
 */

export async function obtenerProyectos(req: Request, res: Response): Promise<void> {
  try {
    const proyectos = await Proyecto.find({ usuario: req.usuario!._id }).sort({
      fechaCreacion: -1,
    });
    res.json({ exito: true, datos: proyectos, mensaje: 'Proyectos cargados.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al cargar los proyectos.' });
  }
}

export async function obtenerProyecto(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador no válido.' });
    return;
  }

  try {
    const proyecto = await Proyecto.findOne({
      _id: req.params.id,
      usuario: req.usuario!._id,
    });
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto encontrado.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al obtener el proyecto.' });
  }
}

export async function crearProyecto(req: Request, res: Response): Promise<void> {
  try {
    const { nombre, cliente, direccion, piezas } = req.body ?? {};
    const proyecto = new Proyecto({
      usuario: req.usuario!._id,
      nombre,
      cliente,
      direccion,
      piezas,
    });
    await proyecto.save();
    res.status(201).json({ exito: true, datos: proyecto, mensaje: 'Proyecto creado.' });
  } catch {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Datos de proyecto no válidos.' });
  }
}

export async function actualizarProyecto(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador no válido.' });
    return;
  }

  try {
    const { nombre, cliente, direccion, piezas } = req.body ?? {};
    const cambios = { nombre, cliente, direccion, piezas };

    const proyecto = await Proyecto.findOneAndUpdate(
      { _id: req.params.id, usuario: req.usuario!._id },
      cambios,
      { new: true, runValidators: true },
    );
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto actualizado.' });
  } catch {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Datos de proyecto no válidos.' });
  }
}

export async function eliminarProyecto(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador no válido.' });
    return;
  }

  try {
    const proyecto = await Proyecto.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario!._id,
    });
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto eliminado.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al eliminar el proyecto.' });
  }
}
