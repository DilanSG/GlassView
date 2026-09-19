import mongoose from 'mongoose';
import { variablesEntorno } from '../config/variablesEntorno.js';

export async function conectarMongo(): Promise<void> {
  try {
    await mongoose.connect(variablesEntorno.mongoUri);
    console.log('Conectado a MongoDB correctamente.');
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error);
    throw error;
  }
}
