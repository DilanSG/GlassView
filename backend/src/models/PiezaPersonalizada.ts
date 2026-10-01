import { model, Schema, type InferSchemaType } from 'mongoose';
import { esquemaForma } from './Pieza.js';

/**
 * Pieza personalizada de la biblioteca del usuario: una forma libre con su
 * REF y su tipo, reutilizable en cualquier plano. Puede ser privada (solo su
 * dueño) o pública (visible para todas las cuentas).
 */
const esquemaPiezaPersonalizada = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    ref: { type: String, required: true, trim: true },
    tipo: {
      type: String,
      enum: ['perfil', 'vidrio', 'acrilico', 'herraje'],
      default: 'perfil',
    },
    categoria: {
      type: String,
      enum: [
        'cabezal',
        'sillar',
        'jamba',
        'horizontal',
        'hoja',
        'riel',
        'canal-u',
        'rodachina',
        'manija',
        'empaque',
        'otro',
      ],
      default: 'otro',
    },
    publico: { type: Boolean, default: false },
    espesorMm: { type: Number, default: 4, min: 1, max: 30 },
    material: {
      type: new Schema(
        {
          nombre: { type: String, required: true, trim: true },
          color: { type: String, required: true, trim: true },
        },
        { _id: false },
      ),
      required: false,
    },
    forma: { type: esquemaForma, required: true },
  },
  { timestamps: true },
);

export type PiezaPersonalizada = InferSchemaType<typeof esquemaPiezaPersonalizada>;

export const PiezaPersonalizada = model('PiezaPersonalizada', esquemaPiezaPersonalizada);
