/**
 * Fachada pública del catálogo de modelos de ventanería.
 *
 * La implementación está dividida en `catalogo/`: tipos compartidos
 * (`tipos.ts`), modelos por familia de sistema (`modelos*.ts`), la
 * agrupación y consultas (`catalogo.ts`) y el cálculo de despiece
 * (`despiece.ts`).
 */
export type {
  BaseMedida,
  FormulaMedida,
  PiezaModelo,
  VidrioModelo,
  AccesorioModelo,
  HojaDiseno,
  DisenoVentaneria,
  ModeloVentaneria,
} from './tipos.js';
export {
  catalogosModelos,
  obtenerModeloVentaneria,
  obtenerModelosParaPaleta,
} from './catalogo.js';
export type {
  PiezaDespiece,
  VidrioDespiece,
  AccesorioDespiece,
  DespieceVentaneria,
} from './despiece.js';
export { calcularDespieceVentaneria } from './despiece.js';