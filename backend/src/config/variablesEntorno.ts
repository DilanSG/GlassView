import 'dotenv/config';

export const variablesEntorno = {
  mongoUri: process.env.MONGO_URI ?? 'mongodb://localhost:27017/glassview',
  puerto: Number(process.env.PORT ?? 4000),
  accessCode: process.env.ACCESS_CODE ?? 'cambia-este-pin',
  secretoToken: process.env.SECRET_TOKEN ?? 'cambia-este-secreto',
  origenesPermitidos: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
};
