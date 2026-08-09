import { Schema, type InferSchemaType } from 'mongoose';

/**
 * Pieza individual dibujada en el plano de un proyecto.
 *
 * Todo es una pieza: un perfil (cabezal, sillar, jamba, enganche...), un
 * vidrio, una rodachina, una manija o un empaque. Las plantillas (presets)
 * solo colocan automáticamente un conjunto de piezas con sus REFs.
 *
 * `id` es el identificador de la pieza (string, la generan el lienzo o el
 * generador de presets). Para perfiles se usa `largoCm` y `orientacion`;
 * para vidrios `anchoCm` y `altoCm`; para puntos (rodachina, manija) solo la
 * posición.
 */
const esquemaPieza = new Schema(
  {
    id: { type: String, required: true },
    tipo: { type: String, required: true },
    ref: { type: String, required: true },
    descripcion: { type: String, trim: true },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    largoCm: { type: Number, default: 0 },
    anchoCm: { type: Number, default: 0 },
    altoCm: { type: Number, default: 0 },
    orientacion: { type: String, enum: ['horizontal', 'vertical', 'punto'], default: 'horizontal' },
    espesorMm: { type: Number, default: 4 },
    cantidad: { type: Number, default: 1 },
    /** true cuando la pieza vino de una plantilla (para poder regenerarla) */
    dePreset: { type: Boolean, default: false },
  },
  { _id: false },
);

export type Pieza = InferSchemaType<typeof esquemaPieza>;

export default esquemaPieza;