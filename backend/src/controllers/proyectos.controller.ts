import type { Request, Response } from 'express';
import { Proyecto } from '../models/Proyecto.js';

export async function obtenerProyectos(_req: Request, res: Response): Promise<void> {
  try {
    const proyectos = await Proyecto.find().sort({ fechaCreacion: -1 });
    res.json({ exito: true, datos: proyectos, mensaje: 'Proyectos cargados.' });
  } catch (error) {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al cargar los proyectos.' });
  }
}

export async function obtenerProyecto(req: Request, res: Response): Promise<void> {
  try {
    const proyecto = await Proyecto.findById(req.params.id);
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto encontrado.' });
  } catch (error) {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al obtener el proyecto.' });
  }
}

export async function crearProyecto(req: Request, res: Response): Promise<void> {
  try {
    const proyecto = new Proyecto(req.body);
    await proyecto.save();
    res.status(201).json({ exito: true, datos: proyecto, mensaje: 'Proyecto creado.' });
  } catch (error) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Datos de proyecto no válidos.' });
  }
}

export async function actualizarProyecto(req: Request, res: Response): Promise<void> {
  try {
    const proyecto = await Proyecto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto actualizado.' });
  } catch (error) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Datos de proyecto no válidos.' });
  }
}

export async function eliminarProyecto(req: Request, res: Response): Promise<void> {
  try {
    const proyecto = await Proyecto.findByIdAndDelete(req.params.id);
    if (!proyecto) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Proyecto no encontrado.' });
      return;
    }
    res.json({ exito: true, datos: proyecto, mensaje: 'Proyecto eliminado.' });
  } catch (error) {
    res.status(500).json({ exito: false, datos: null, mensaje: 'Error al eliminar el proyecto.' });
  }
}