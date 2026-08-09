/**
 * Catálogo de modelos de ventanería agrupados por sistema de ventana.
 *
 * Los modelos de cada familia viven en `modelos*.ts` y aquí se combinan en un
 * único arreglo `catalogosModelos` (mismo orden que en el Excel) con las
 * funciones de consulta utilizadas por la API.
 */
import type { DisenoVentaneria, ModeloVentaneria } from './tipos.js';
import { modelos5020 } from './modelos5020.js';
import { modelos744 } from './modelos744.js';
import { modelos8025 } from './modelos8025.js';
import { modelos7038 } from './modelos7038.js';
import { modelos3831 } from './modelos3831.js';
import { modelosPb } from './modelosPb.js';
import { modelosDivibano } from './modelosDivibano.js';

export const catalogosModelos: ModeloVentaneria[] = [
  ...modelos5020,
  ...modelos744,
  ...modelos8025,
  ...modelos7038,
  ...modelos3831,
  ...modelosPb,
  ...modelosDivibano,
];

export function obtenerModeloVentaneria(id: string): ModeloVentaneria | undefined {
  return catalogosModelos.find((modelo) => modelo.id === id);
}

export function obtenerModelosParaPaleta(): Array<{
  id: string;
  nombre: string;
  sistema: string;
  diseno: DisenoVentaneria;
  ejemplo: { ancho: number; alto: number };
}> {
  return catalogosModelos.map((modelo) => ({
    id: modelo.id,
    nombre: modelo.nombre,
    sistema: modelo.sistema,
    diseno: modelo.diseno,
    ejemplo: modelo.ejemplo,
  }));
}
