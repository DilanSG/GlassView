import { Router } from 'express';
import {
  actualizarPerfil,
  actualizarUsuarioAdmin,
  cambiarContrasena,
  crearUsuarioAdmin,
  eliminarCuenta,
  eliminarUsuarioAdmin,
  iniciarSesion,
  listarUsuariosAdmin,
  obtenerPerfil,
  obtenerUsuarioAdmin,
  registrarUsuario,
} from '../controllers/auth.controller.js';
import { autenticar } from '../middleware/autenticar.js';
import { soloAdmin } from '../middleware/soloAdmin.js';

const router = Router();

router.post('/registro', registrarUsuario);
router.post('/login', iniciarSesion);

router.get('/perfil', autenticar, obtenerPerfil);
router.put('/perfil', autenticar, actualizarPerfil);
router.put('/contrasena', autenticar, cambiarContrasena);
router.delete('/cuenta', autenticar, eliminarCuenta);

router.get('/usuarios', autenticar, soloAdmin, listarUsuariosAdmin);
router.post('/usuarios', autenticar, soloAdmin, crearUsuarioAdmin);
router.get('/usuarios/:id', autenticar, soloAdmin, obtenerUsuarioAdmin);
router.put('/usuarios/:id', autenticar, soloAdmin, actualizarUsuarioAdmin);
router.delete('/usuarios/:id', autenticar, soloAdmin, eliminarUsuarioAdmin);

export default router;
