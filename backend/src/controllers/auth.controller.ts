import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { variablesEntorno } from '../config/variablesEntorno.js';
import { Usuario } from '../models/Usuario.js';
import { Proyecto } from '../models/Proyecto.js';
import { hashearContrasena, verificarContrasena } from '../services/contrasenas.js';
import { usuarioPublico } from '../services/suscripcion.js';
import { crearToken } from '../services/token.js';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MINIMO_CONTRASENA = 6;
const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

function limpiarTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

function esErrorDuplicado(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
}

/** Registra una cuenta nueva y arranca su prueba gratuita. */
export async function registrarUsuario(req: Request, res: Response): Promise<void> {
  const nombre = limpiarTexto(req.body?.nombre);
  const email = limpiarTexto(req.body?.email).toLowerCase();
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';

  if (nombre.length < 2) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El nombre debe tener al menos 2 caracteres.' });
    return;
  }
  if (!EMAIL_VALIDO.test(email)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El correo electrónico no es válido.' });
    return;
  }
  if (contrasena.length < MINIMO_CONTRASENA) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: `La contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`,
    });
    return;
  }

  try {
    const existente = await Usuario.findOne({ email });
    if (existente) {
      res.status(409).json({ exito: false, datos: null, mensaje: 'Ya existe una cuenta con ese correo.' });
      return;
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      contrasenaHash: await hashearContrasena(contrasena),
      pruebaHasta: new Date(Date.now() + variablesEntorno.diasPrueba * MILISEGUNDOS_DIA),
    });

    res.status(201).json({
      exito: true,
      datos: { token: crearToken(usuario._id.toString()), usuario: usuarioPublico(usuario) },
      mensaje: `Cuenta creada. Tienes ${variablesEntorno.diasPrueba} días de prueba gratuita.`,
    });
  } catch (error) {
    if (esErrorDuplicado(error)) {
      res.status(409).json({ exito: false, datos: null, mensaje: 'Ya existe una cuenta con ese correo.' });
      return;
    }
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo crear la cuenta.' });
  }
}

/** Inicia sesión con correo y contraseña. */
export async function iniciarSesion(req: Request, res: Response): Promise<void> {
  const email = limpiarTexto(req.body?.email).toLowerCase();
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';

  if (!email || !contrasena) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Correo y contraseña son obligatorios.' });
    return;
  }

  try {
    const usuario = await Usuario.findOne({ email });
    if (!usuario || !(await verificarContrasena(contrasena, usuario.contrasenaHash))) {
      res.status(401).json({ exito: false, datos: null, mensaje: 'Correo o contraseña incorrectos.' });
      return;
    }
    if (!usuario.activo) {
      res.status(403).json({
        exito: false,
        datos: null,
        mensaje: 'Tu cuenta está bloqueada. Contacta con soporte de GlassView.',
        codigo: 'CUENTA_BLOQUEADA',
      });
      return;
    }

    res.json({
      exito: true,
      datos: { token: crearToken(usuario._id.toString()), usuario: usuarioPublico(usuario) },
      mensaje: 'Sesión iniciada.',
    });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo iniciar sesión.' });
  }
}

/** Devuelve el perfil y el estado de acceso del usuario autenticado. */
export function obtenerPerfil(req: Request, res: Response): void {
  res.json({ exito: true, datos: usuarioPublico(req.usuario!), mensaje: 'Perfil cargado.' });
}

/** Actualiza el nombre y el correo del usuario autenticado. */
export async function actualizarPerfil(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const nombre = limpiarTexto(req.body?.nombre);
  const email = limpiarTexto(req.body?.email).toLowerCase();

  if (nombre.length < 2) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El nombre debe tener al menos 2 caracteres.' });
    return;
  }
  if (!EMAIL_VALIDO.test(email)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El correo electrónico no es válido.' });
    return;
  }

  try {
    if (email !== usuario.email) {
      const existente = await Usuario.findOne({ email, _id: { $ne: usuario._id } });
      if (existente) {
        res.status(409).json({ exito: false, datos: null, mensaje: 'Ese correo ya está en uso.' });
        return;
      }
    }

    usuario.nombre = nombre;
    usuario.email = email;
    await usuario.save();

    res.json({ exito: true, datos: usuarioPublico(usuario), mensaje: 'Perfil actualizado.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo actualizar el perfil.' });
  }
}

/** Cambia la contraseña comprobando la actual. */
export async function cambiarContrasena(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;
  const contrasenaActual = typeof req.body?.contrasenaActual === 'string' ? req.body.contrasenaActual : '';
  const contrasenaNueva = typeof req.body?.contrasenaNueva === 'string' ? req.body.contrasenaNueva : '';

  if (contrasenaNueva.length < MINIMO_CONTRASENA) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: `La nueva contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`,
    });
    return;
  }
  if (!(await verificarContrasena(contrasenaActual, usuario.contrasenaHash))) {
    res.status(401).json({ exito: false, datos: null, mensaje: 'La contraseña actual no es correcta.' });
    return;
  }

  try {
    usuario.contrasenaHash = await hashearContrasena(contrasenaNueva);
    await usuario.save();
    res.json({ exito: true, datos: null, mensaje: 'Contraseña actualizada.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo cambiar la contraseña.' });
  }
}

/** Elimina la cuenta del usuario junto con sus proyectos. */
export async function eliminarCuenta(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;

  try {
    await Proyecto.deleteMany({ usuario: usuario._id });
    await usuario.deleteOne();
    res.json({ exito: true, datos: null, mensaje: 'Cuenta eliminada.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo eliminar la cuenta.' });
  }
}

/** (Admin) Crea una cuenta manualmente. */
export async function crearUsuarioAdmin(req: Request, res: Response): Promise<void> {
  const nombre = limpiarTexto(req.body?.nombre);
  const email = limpiarTexto(req.body?.email).toLowerCase();
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';
  const rol = req.body?.rol === 'admin' ? 'admin' : 'usuario';
  const pruebaHasta = req.body?.pruebaHasta ? new Date(req.body.pruebaHasta) : null;

  if (nombre.length < 2 || !EMAIL_VALIDO.test(email) || contrasena.length < MINIMO_CONTRASENA) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: 'Revisa el nombre, el correo y la contraseña (mínimo 6 caracteres).',
    });
    return;
  }
  if (pruebaHasta && Number.isNaN(pruebaHasta.getTime())) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'La fecha de prueba no es válida.' });
    return;
  }

  try {
    const existente = await Usuario.findOne({ email });
    if (existente) {
      res.status(409).json({ exito: false, datos: null, mensaje: 'Ya existe una cuenta con ese correo.' });
      return;
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      contrasenaHash: await hashearContrasena(contrasena),
      rol,
      activo: req.body?.activo !== false,
      pruebaHasta: pruebaHasta ?? new Date(Date.now() + variablesEntorno.diasPrueba * MILISEGUNDOS_DIA),
    });

    res.status(201).json({ exito: true, datos: usuarioPublico(usuario), mensaje: 'Usuario creado.' });
  } catch (error) {
    if (esErrorDuplicado(error)) {
      res.status(409).json({ exito: false, datos: null, mensaje: 'Ya existe una cuenta con ese correo.' });
      return;
    }
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo crear el usuario.' });
  }
}

/** (Admin) Lista todas las cuentas. */
export async function listarUsuariosAdmin(_req: Request, res: Response): Promise<void> {
  try {
    const usuarios = await Usuario.find().sort({ fechaRegistro: -1 });
    res.json({ exito: true, datos: usuarios.map(usuarioPublico), mensaje: 'Usuarios cargados.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudieron cargar los usuarios.' });
  }
}

/** (Admin) Obtiene una cuenta por su id. */
export async function obtenerUsuarioAdmin(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador de usuario no válido.' });
    return;
  }

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) {
    res.status(404).json({ exito: false, datos: null, mensaje: 'Usuario no encontrado.' });
    return;
  }

  res.json({ exito: true, datos: usuarioPublico(usuario), mensaje: 'Usuario encontrado.' });
}

/** (Admin) Actualiza rol, estado, prueba, suscripción o datos de una cuenta. */
export async function actualizarUsuarioAdmin(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador de usuario no válido.' });
    return;
  }

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) {
    res.status(404).json({ exito: false, datos: null, mensaje: 'Usuario no encontrado.' });
    return;
  }

  const esUnoMismo = usuario._id.equals(req.usuario!._id);
  const nombre = limpiarTexto(req.body?.nombre);
  const email = limpiarTexto(req.body?.email).toLowerCase();
  const contrasena = typeof req.body?.contrasena === 'string' ? req.body.contrasena : '';
  const rol = req.body?.rol;

  if (nombre && nombre.length < 2) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El nombre debe tener al menos 2 caracteres.' });
    return;
  }
  if (email && !EMAIL_VALIDO.test(email)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El correo electrónico no es válido.' });
    return;
  }
  if (rol !== undefined && rol !== 'usuario' && rol !== 'admin') {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El rol indicado no es válido.' });
    return;
  }
  if (contrasena && contrasena.length < MINIMO_CONTRASENA) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: `La contraseña debe tener al menos ${MINIMO_CONTRASENA} caracteres.`,
    });
    return;
  }
  if (esUnoMismo && (rol === 'usuario' || req.body?.activo === false)) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: 'No puedes quitarte el rol de administrador ni bloquear tu propia cuenta.',
    });
    return;
  }

  try {
    if (email && email !== usuario.email) {
      const existente = await Usuario.findOne({ email, _id: { $ne: usuario._id } });
      if (existente) {
        res.status(409).json({ exito: false, datos: null, mensaje: 'Ese correo ya está en uso.' });
        return;
      }
      usuario.email = email;
    }
    if (nombre) {
      usuario.nombre = nombre;
    }
    if (rol) {
      usuario.rol = rol;
    }
    if (typeof req.body?.activo === 'boolean') {
      usuario.activo = req.body.activo;
    }
    if (contrasena) {
      usuario.contrasenaHash = await hashearContrasena(contrasena);
    }
    if (req.body?.pruebaHasta) {
      const pruebaHasta = new Date(req.body.pruebaHasta);
      if (Number.isNaN(pruebaHasta.getTime())) {
        res.status(400).json({ exito: false, datos: null, mensaje: 'La fecha de prueba no es válida.' });
        return;
      }
      usuario.pruebaHasta = pruebaHasta;
    }
    if (req.body?.suscripcion && typeof req.body.suscripcion === 'object') {
      const cambios = req.body.suscripcion as Record<string, unknown>;
      const actual = usuario.suscripcion;
      usuario.set('suscripcion', {
        activa: typeof cambios.activa === 'boolean' ? cambios.activa : Boolean(actual?.activa),
        fechaInicio: cambios.fechaInicio ? new Date(String(cambios.fechaInicio)) : actual?.fechaInicio,
        fechaFin: cambios.fechaFin ? new Date(String(cambios.fechaFin)) : actual?.fechaFin,
        ultimoPago: actual?.ultimoPago,
      });
    }

    await usuario.save();
    res.json({ exito: true, datos: usuarioPublico(usuario), mensaje: 'Usuario actualizado.' });
  } catch (error) {
    if (esErrorDuplicado(error)) {
      res.status(409).json({ exito: false, datos: null, mensaje: 'Ese correo ya está en uso.' });
      return;
    }
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo actualizar el usuario.' });
  }
}

/** (Admin) Elimina una cuenta y sus proyectos. */
export async function eliminarUsuarioAdmin(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador de usuario no válido.' });
    return;
  }
  if (req.usuario!._id.equals(req.params.id)) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: 'No puedes eliminar tu propia cuenta desde el panel.',
    });
    return;
  }

  const usuario = await Usuario.findById(req.params.id);
  if (!usuario) {
    res.status(404).json({ exito: false, datos: null, mensaje: 'Usuario no encontrado.' });
    return;
  }

  try {
    await Proyecto.deleteMany({ usuario: usuario._id });
    await usuario.deleteOne();
    res.json({ exito: true, datos: null, mensaje: 'Usuario eliminado.' });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo eliminar el usuario.' });
  }
}
