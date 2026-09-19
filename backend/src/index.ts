import { crearAplicacion } from './app.js';
import { variablesEntorno } from './config/variablesEntorno.js';
import { asegurarAdminInicial } from './services/bootstrap.js';
import { conectarMongo } from './services/conexionMongo.js';

async function iniciarServidor(): Promise<void> {
  await conectarMongo();
  await asegurarAdminInicial();

  const aplicacion = crearAplicacion();
  aplicacion.listen(variablesEntorno.puerto, () => {
    console.log(`GlassView backend escuchando en el puerto ${variablesEntorno.puerto}`);
  });
}

iniciarServidor().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
