import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { variablesEntorno } from './config/variablesEntorno.js';
import { especificacionApi } from './docs/apiEspecificacion.js';
import { manejarErrores } from './middleware/manejarErrores.js';
import { verificarPin } from './middleware/verificarPin.js';
import authRoutes from './routes/auth.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import proyectosRoutes from './routes/proyectos.routes.js';

export function crearAplicacion(): Express {
  const aplicacion = express();

  aplicacion.use(
    cors({
      origin: variablesEntorno.origenesPermitidos,
    }),
  );
  aplicacion.use(express.json());

  aplicacion.get('/api/estado', (_req, res) => {
    res.json({ estado: 'ok', mensaje: 'GlassView backend en línea.' });
  });

  aplicacion.use('/api/auth', authRoutes);
  aplicacion.use('/api/catalogo-ventaneria', verificarPin, catalogoRoutes);
  aplicacion.use('/api/proyectos', verificarPin, proyectosRoutes);

  aplicacion.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacionApi));

  aplicacion.use(manejarErrores);

  return aplicacion;
}