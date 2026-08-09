import { Router } from 'express';
import { verificarPinYDevolverToken } from '../controllers/auth.controller.js';

const router = Router();

router.post('/verificar-pin', verificarPinYDevolverToken);

export default router;