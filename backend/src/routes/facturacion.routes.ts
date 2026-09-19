import { Router } from 'express';
import {
  obtenerFacturacion,
  obtenerPrecio,
  simularPago,
} from '../controllers/facturacion.controller.js';
import { autenticar } from '../middleware/autenticar.js';

const router = Router();

router.get('/precio', obtenerPrecio);
router.get('/', autenticar, obtenerFacturacion);
router.post('/pagar', autenticar, simularPago);

export default router;
