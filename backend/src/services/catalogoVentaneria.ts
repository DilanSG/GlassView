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
} from './catalogo/tipos.js';
export {
  catalogosModelos,
  obtenerModeloVentaneria,
  obtenerModelosParaPaleta,
} from './catalogo/catalogo.js';
export type {
  PiezaDespiece,
  VidrioDespiece,
  AccesorioDespiece,
  DespieceVentaneria,
} from './catalogo/despiece.js';
export { calcularDespieceVentaneria } from './catalogo/despiece.js';