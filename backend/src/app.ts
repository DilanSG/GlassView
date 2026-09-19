import cors from 'cors';
import express, { type Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import { variablesEntorno } from './config/variablesEntorno.js';
import { especificacionApi } from './docs/apiEspecificacion.js';
import { autenticar } from './middleware/autenticar.js';
import { manejarErrores } from './middleware/manejarErrores.js';
import { requiereSuscripcion } from './middleware/requiereSuscripcion.js';
import authRoutes from './routes/auth.routes.js';
import catalogoRoutes from './routes/catalogo.routes.js';
import facturacionRoutes from './routes/facturacion.routes.js';
import proyectosRoutes from './routes/proyectos.routes.js';

export function crearAplicacion(): Express {
  const aplicacion = express();

  aplicacion.set('trust proxy', true);
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
  aplicacion.use('/api/facturacion', facturacionRoutes);
  aplicacion.use('/api/catalogo-ventaneria', autenticar, requiereSuscripcion, catalogoRoutes);
  aplicacion.use('/api/proyectos', autenticar, requiereSuscripcion, proyectosRoutes);

  aplicacion.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacionApi));

  aplicacion.use(manejarErrores);

  return aplicacion;
}
