import { Router } from 'express';
import {
  actualizarPiezaPersonalizada,
  crearPiezaPersonalizada,
  eliminarPiezaPersonalizada,
  listarPiezasPersonalizadas,
} from '../controllers/piezasPersonalizadas.controller.js';

const router = Router();

router.get('/', listarPiezasPersonalizadas);
router.post('/', crearPiezaPersonalizada);
router.put('/:id', actualizarPiezaPersonalizada);
router.delete('/:id', eliminarPiezaPersonalizada);

export default router;
