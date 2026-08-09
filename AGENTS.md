# AGENTS.md — GlassView2.0

Guía de convenciones para todo agente (IA o humano) que escriba código en este repositorio.

## Idioma del código

Este proyecto se escribe **en español** como si lo desarrollara un equipo hispanohablante:

- **Variables**: nombres en español (`anchoCristal`, `numeroHuecos`, `esInstalado`).
- **Funciones y métodos**: nombres en español en formato `camelCase` (`calcularMedidaCristal`, `obtenerProyectos`, `guardarCambios`).
- **Clases y tipos**: nombres en español en `PascalCase` (`Proyecto`, `Hueco`, `Elemento`).
- **Archivos y carpetas**: nombres en español en `camelCase` o `kebab-case` (`proyectos.routes.ts`, `verificarPin.ts`).
- **Mensajes de error, logs y textos de interfaz**: siempre en español.
- **Excepciones permitidas**: palabras técnicas sin traducción natural (API, HTTP, CRUD, React, token, middleware, endpoint, canvas, express) y nombres de librerías, paquetes y tipos del ecosistema (Mongoose, Router, Request, Response).

### Ejemplos

```ts
// Correcto
const anchoCristal = calcularMedidaCristal(hueco, peralte);
function obtenerProyectos(): Promise<Proyecto[]> { ... }

// Incorrecto
const glassWidth = calculateGlassMeasure(hueco, peralte);
```

### Buenas prácticas por encima del idioma

El idioma del código es español, pero **no a costa de las buenas prácticas**: el equipo también domina el inglés como segundo idioma y sigue las convenciones profesionales del ecosistema:

- **Nombres de variables de entorno**: en inglés estándar (`PORT`, `MONGO_URI`, `SECRET_TOKEN`, `ALLOWED_ORIGINS`), como exige la convención de `.env`; los nombres internos en español los leen (`variablesEntorno.puerto`, `variablesEntorno.secretoToken`).
- **Configuración del proyecto** (`package.json`, `tsconfig.json`, `vite.config.ts`): claves en inglés (`name`, `scripts`, `dependencies`), que son del propio estándar.
- **Dependencias, imports y APIs de librerías**: nombres originales en inglés (Mongoose, React, Express, Router).
- **Patrones de diseño, arquitectura y estilo de código**: se aplican las buenas prácticas del ecosistema (TypeScript estricto, manejo de errores, async/await, separación de responsabilidades, convenciones de React).
- **Nombres de tablas/modelos de base de datos y claves de MongoDB**: en inglés o español según el estándar de cada herramienta, siempre de forma consistente.
- **Restricción**: las buenas prácticas nunca deben llevar a traducir identificadores ya establecidos a medias ni a mezclar idiomas en un mismo identificador (`obtenerGlassWidth` sigue prohibido).

## Estructura del proyecto

```
GlassView2.0/
├── backend/     # API Express + TypeScript + Mongoose (MongoDB Atlas)
└── frontend/    # React + TypeScript + Vite + Konva.js
```

## Backend

- Framework: **Express** + **TypeScript** en modo estricto.
- Base de datos: **MongoDB Atlas** con **Mongoose**. Migración futura a PostgreSQL prevista, mantener la lógica de negocio aislada de la capa de datos en `services/`.
- Endpoints en `/api/...`, respuestas en JSON con `{ exito, datos, mensaje }`.
- Seguridad: PIN compartido vía token firmado con HMAC (sin cuentas de usuario). Verificar token en cada petición con el middleware `verificarPin`.
- Cálculos de medidas (lógica de negocio) en `backend/src/services/calculos.ts`.
- `npm run dev` para desarrollo. Variables de entorno en `.env` (ver `.env.example`).

## Frontend

- **React** + **TypeScript** + **Vite** + **react-router-dom**.
- Lienzo de dibujo con **Konva.js** (fases posteriores).
- Páginas en `src/pages/`, componentes reutilizables en `src/components/`.
- Cliente HTTP en `src/api/clienteApi.ts`: añade el token de acceso de `localStorage` y usa `VITE_API_URL` (o el proxy `/api` en desarrollo).

## Reglas generales

1. No mezclar inglés y español en el mismo identificador (`obtenerGlassWidth` está prohibido).
2. Los comentarios, si existen, van en español y solo cuando aportan valor.
3. Respetar el estilo existente de cada archivo antes de editarlo.
4. No subir `.env` ni secretos al repositorio; usar `.env.example` como plantilla.
5. Ejecutar `npm run build` en cada carpeta (backend y frontend) antes de dar por terminada una tarea.
