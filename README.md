# GlassView2.0

Aplicación para **dibujar planos de instalaciones de cristalería** y calcular su despiece automáticamente: perfiles, vidrio, herrajes y empaque, con medidas reales calculadas a partir de un catálogo de modelos de ventanería.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js + Express + TypeScript (estricto) |
| Base de datos | MongoDB Atlas (o local) con Mongoose |
| Frontend | React 18 + TypeScript + Vite |
| Lienzo de dibujo | Konva.js (react-konva) |
| Exportación de planos | jsPDF + html2canvas |
| Documentación de la API | Swagger UI (OpenAPI 3.0) |

## Estructura del repositorio

```
GlassView2.0/
├── backend/                  # API REST en Express + TypeScript
│   └── src/
│       ├── config/           # Variables de entorno
│       ├── controllers/      # Lógica de los endpoints
│       ├── docs/             # Especificación OpenAPI (Swagger)
│       ├── middleware/       # verificarPin, manejarErrores
│       ├── models/           # Esquemas de Mongoose (Proyecto, Pieza)
│       ├── routes/           # Definición de rutas
│       └── services/         # Token, catálogo de ventanería, despieces...
├── frontend/                 # Interfaz de usuario
│   └── src/
│       ├── api/              # Cliente HTTP (clienteApi.ts)
│       ├── components/       # Editor de diseño y lienzo
│       ├── componentes/      # Componentes de lienzo y paneles reutilizables
│       ├── estilos/          # CSS dividido por secciones
│       ├── hooks/            # useZoomPan, useRejilla, useTema
│       ├── pages/            # Acceso, Proyectos, NuevoProyecto, EditorPlano
│       ├── pdf/              # Exportación del plano a PDF
│       └── utils/            # Geometría y colores del lienzo
└── AGENTS.md                 # Convenciones de código del proyecto
```

## Requisitos

- Node.js ≥ 20
- npm
- MongoDB (Atlas o local)

## Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env   # ajustar las variables

# Frontend
cd ../frontend
npm install
# .env opcional; en desarrollo el frontend usa el proxy /api de Vite
```

## Variables de entorno (backend)

| Variable | Descripción |
|---|---|
| `MONGO_URI` | Conexión a MongoDB (Atlas o local) |
| `PORT` | Puerto del servidor (por defecto 4000) |
| `ACCESS_CODE` | PIN compartido para entrar a la aplicación |
| `SECRET_TOKEN` | Clave para firmar los tokens de acceso (HMAC) |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS, separados por comas |

## Ejecución

```bash
# Backend (tsx watch, recarga automática) → http://localhost:4000
cd backend && npm run dev

# Frontend (Vite) → http://localhost:5173
cd frontend && npm run dev
```

En desarrollo, Vite redirige `/api` al backend local (`http://localhost:4000`) mediante proxy.

## Scripts

| Carpeta | Comando | Qué hace |
|---|---|---|
| backend | `npm run dev` | Arranca la API con recarga automática |
| backend | `npm run build` | Compila TypeScript a `dist/` |
| backend | `npm start` | Ejecuta la API compilada |
| frontend | `npm run dev` | Arranca Vite en modo desarrollo |
| frontend | `npm run build` | TypeScript + empaquetado de producción |

## Documentación

- **[Funcionalidades](README.FUNCIONALIDADES.md)** — qué hace el proyecto y cómo se usa cada parte, con detalle del lienzo y el catálogo de ventanería.
- **[Guía para desarrolladores](README.DESARROLLADORES.md)** — cómo está estructurado el código y cómo ampliarlo.
- **[Swagger UI](http://localhost:4000/api/docs)** — documentación interactiva de la API (endpoints, cuerpos y respuestas).
- **[AGENTS.md](AGENTS.md)** — convenciones de código: identificadores en español, buenas prácticas.