import { model, Schema, type InferSchemaType } from 'mongoose';
import esquemaPieza from './Pieza.js';

/**
 * Hueco de obra: medidas reales del vano donde se instala la cristalería.
 * Cuando existe, el lienzo del editor se dimensiona a este tamaño.
 */
const esquemaHueco = new Schema(
  {
    anchoCm: { type: Number, required: true, min: 1 },
    altoCm: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

/**
 * Proyecto: plano de instalación compuesto por piezas dibujadas
 * (perfiles, vidrios y herrajes).
 */
const esquemaProyecto = new Schema(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },
    nombre: { type: String, required: true, trim: true },
    cliente: { type: String, trim: true },
    direccion: { type: String, trim: true },
    /** Medidas del hueco; ausente o null = mapa libre (lienzo infinito). */
    hueco: { type: esquemaHueco, default: undefined },
    fechaCreacion: { type: Date, default: Date.now },
    piezas: { type: [esquemaPieza], default: [] },
  },
  { timestamps: true },
);

export type Proyecto = InferSchemaType<typeof esquemaProyecto> & {
  piezas: Array<{
    id: string;
    tipo: string;
    ref: string;
    descripcion?: string;
    x: number;
    y: number;
    largoCm: number;
    anchoCm: number;
    altoCm: number;
    orientacion: 'horizontal' | 'vertical' | 'punto';
    espesorMm: number;
    cantidad: number;
    dePreset?: boolean;
  }>;
};

export const Proyecto = model('Proyecto', esquemaProyecto);