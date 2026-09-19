import 'dotenv/config';

/** Convierte una variable de entorno numérica, con respaldo si no es válida. */
function numeroSeguro(valor: string | undefined, porDefecto: number): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : porDefecto;
}

export const variablesEntorno = {
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/glassview',
  puerto: numeroSeguro(process.env.PORT, 4000),
  secretoToken: process.env.SECRET_TOKEN ?? 'cambia-este-secreto',
  origenesPermitidos: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
  /** Días de prueba gratuita que recibe cada cuenta nueva. */
  diasPrueba: numeroSeguro(process.env.TRIAL_DAYS, 10),
  /** Precio mensual de la suscripción en dólares. */
  precioUsd: numeroSeguro(process.env.PRICE_USD, 10),
  /** Cuenta de administrador creada al arrancar (opcional). */
  adminEmail: process.env.ADMIN_EMAIL ?? '',
  adminPassword: process.env.ADMIN_PASSWORD ?? '',
};
