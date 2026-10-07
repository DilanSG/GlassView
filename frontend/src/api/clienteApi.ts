/**
 * Fachada pública de la API.
 *
 * Los módulos viven separados por dominio en `src/api/` (auth, proyectos,
 * catálogo, piezas y facturación) y esta fachada los agrupa para que el resto
 * de la aplicación importe siempre desde `api/clienteApi`.
 */
export * from './http';
export * from './auth';
export * from './proyectos';
export * from './catalogo';
export * from './piezas';
export * from './facturacion';
