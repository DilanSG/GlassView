import { Router } from 'express';
import {
  calcularDespiece,
  calcularDespiecePorPiezas,
  generarPreset,
  obtenerCatalogo,
  obtenerPerfiles,
} from '../controllers/catalogo.controller.js';

const router = Router();

router.get('/', obtenerCatalogo);
router.get('/perfiles', obtenerPerfiles);
router.post('/despiece', calcularDespiece);
router.post('/despiece-piezas', calcularDespiecePorPiezas);
router.post('/preset', generarPreset);

export default router;