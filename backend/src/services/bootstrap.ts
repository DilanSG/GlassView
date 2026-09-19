import { variablesEntorno } from '../config/variablesEntorno.js';
import { Usuario } from '../models/Usuario.js';
import { hashearContrasena } from './contrasenas.js';

/**
 * Garantiza que exista la cuenta administradora definida en el entorno.
 * Si el correo ya existe, solo se asegura de que tenga el rol admin.
 */
export async function asegurarAdminInicial(): Promise<void> {
  const { adminEmail, adminPassword } = variablesEntorno;
  if (!adminEmail || !adminPassword) {
    return;
  }

  const email = adminEmail.toLowerCase();
  const existente = await Usuario.findOne({ email });

  if (existente) {
    if (existente.rol !== 'admin' || !existente.activo) {
      existente.rol = 'admin';
      existente.activo = true;
      await existente.save();
      console.log(`Cuenta administradora actualizada: ${email}`);
    }
    return;
  }

  if (await Usuario.exists({ rol: 'admin' })) {
    return;
  }

  await Usuario.create({
    nombre: 'Administrador',
    email,
    contrasenaHash: await hashearContrasena(adminPassword),
    rol: 'admin',
    activo: true,
    pruebaHasta: new Date(0),
  });
  console.log(`Cuenta administradora creada: ${email}`);
}
