import { model, Schema, type InferSchemaType } from 'mongoose';

/**
 * Pago registrado de una suscripción (el cobro real lo hará la pasarela;
 * aquí se guarda el comprobante del período facturado).
 */
const esquemaPago = new Schema(
  {
    fecha: { type: Date, default: Date.now },
    montoUsd: { type: Number, required: true },
    moneda: { type: String, required: true, uppercase: true, trim: true },
    montoLocal: { type: Number, required: true },
    referencia: { type: String, required: true, trim: true },
  },
  { _id: false },
);

/** Suscripción mensual activa del usuario. */
const esquemaSuscripcion = new Schema(
  {
    activa: { type: Boolean, default: false },
    fechaInicio: { type: Date },
    fechaFin: { type: Date },
    ultimoPago: { type: Date },
  },
  { _id: false },
);

/**
 * Cuenta de usuario de GlassView. Cada cuenta tiene una prueba gratuita de
 * `TRIAL_DAYS` días desde su registro; al terminarse se bloquean las funciones
 * de dibujo hasta que la suscripción esté activa.
 */
const esquemaUsuario = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contrasenaHash: { type: String, required: true },
    rol: { type: String, enum: ['usuario', 'admin'], default: 'usuario' },
    activo: { type: Boolean, default: true },
    fechaRegistro: { type: Date, default: Date.now },
    pruebaHasta: { type: Date, required: true },
    suscripcion: { type: esquemaSuscripcion, default: () => ({}) },
    pagos: { type: [esquemaPago], default: [] },
    pais: { type: String, uppercase: true, trim: true },
    moneda: { type: String, uppercase: true, trim: true },
  },
  { timestamps: true },
);

export type Usuario = InferSchemaType<typeof esquemaUsuario>;

export const Usuario = model('Usuario', esquemaUsuario);
