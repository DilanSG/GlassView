import { model, Schema, type InferSchemaType } from 'mongoose';
import esquemaPieza from './Pieza.js';

/**
 * Proyecto: plano de instalación compuesto por piezas dibujadas
 * (perfiles, vidrios y herrajes).
 */
const esquemaProyecto = new Schema(
  {
    nombre: { type: String, required: true, trim: true },
    cliente: { type: String, trim: true },
    direccion: { type: String, trim: true },
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