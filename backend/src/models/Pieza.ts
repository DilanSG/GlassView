import { Schema, type InferSchemaType } from 'mongoose';

const esquemaPunto = new Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
  },
  { _id: false },
);

const esquemaMaterialTrazo = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const esquemaTrazo = new Schema(
  {
    rol: { type: String, enum: ['contorno', 'vacio'], default: 'contorno' },
    visible: { type: Boolean, default: true },
    /** Nombre propio de la capa; si falta se muestra «Capa N». */
    nombre: { type: String, trim: true },
    puntos: { type: [esquemaPunto], default: [] },
    /** Material propio de la capa; si falta, usa el de la pieza. */
    material: { type: esquemaMaterialTrazo, required: false },
  },
  { _id: false },
);

/**
 * Forma libre de una pieza creada por el usuario: se dibuja en un lienzo de
 * diseño (`anchoCm` × `altoCm`, en cm) y al colocarla se escala al tamaño de
 * la pieza. `contorno` es la silueta; `vacio` son cámaras huecas.
 */
export const esquemaForma = new Schema(
  {
    anchoCm: { type: Number, required: true, min: 0.5 },
    altoCm: { type: Number, required: true, min: 0.5 },
    color: { type: String },
    trazos: { type: [esquemaTrazo], default: [] },
  },
  { _id: false },
);

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
 * posición. `forma` está presente solo en piezas creadas con el editor de
 * formas personalizadas.
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
    forma: { type: esquemaForma, required: false },
  },
  { _id: false },
);

export type Pieza = InferSchemaType<typeof esquemaPieza>;

export default esquemaPieza;
