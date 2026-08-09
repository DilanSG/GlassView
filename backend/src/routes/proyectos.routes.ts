import { Router } from 'express';
import {
  actualizarProyecto,
  crearProyecto,
  eliminarProyecto,
  obtenerProyecto,
  obtenerProyectos,
} from '../controllers/proyectos.controller.js';

const router = Router();

router.get('/', obtenerProyectos);
router.post('/', crearProyecto);
router.get('/:id', obtenerProyecto);
router.put('/:id', actualizarProyecto);
router.delete('/:id', eliminarProyecto);

export default router;