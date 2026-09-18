# GlassView

Sistema profesional para el **diseño de planos de instalaciones de cristalería** y la generación automática de su **despiece**: perfiles, vidrio, herrajes y empaque, con medidas reales calculadas a partir de un catálogo de modelos de ventanería.

> **GlassView es un producto comercial de IntoCode.** El código fuente es público para su lectura y estudio, pero su funcionalidad no puede copiarse ni emplearse con fines comerciales sin una licencia de IntoCode. Ver [Licencia](#licencia).

---

## Índice

- [Características](#características)
- [Stack tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Puesta en marcha](#puesta-en-marcha)
- [Scripts](#scripts)
- [API](#api)
- [Catálogo de ventanería](#catálogo-de-ventanería)
- [Pruebas y verificación](#pruebas-y-verificación)
- [Despliegue](#despliegue)
- [Licencia y créditos](#licencia-y-créditos)

---

## Características

- **Lienzo de dibujo a escala real** en centímetros, con retícula de precisión, zoom, desplazamiento y herramientas de perfilería (cabezales, sillares, jambas, hojas, rieles, vidrios, rodachinas, manijas y empaques).
- **Plantillas por modelo**: generan automáticamente todas las piezas de una ventana (marco, hojas y vidrios) con las medidas del fabricante.
- **Catálogo de ventanería integrado**: 22 modelos reales en 7 familias (5020, 744, 8025, 7038, 3831, P.B. y Divibano), con fórmulas de medida propias.
- **Despiece automático**: consolidación por REF en metros lineales, vidrio en metros cuadrados, accesorios y empaques, con precios opcionales.
- **Gestión de proyectos**: obras con cliente y dirección, persistidas en MongoDB.
- **Exportación a PDF**: plano vectorial en A5 (horizontal o vertical) con cotas en centímetros en los cuatro lados.
- **Acceso seguro por PIN** con tokens firmados (HMAC) y expiración a 30 días; si el token expira o se pierde, la aplicación vuelve a pedir el PIN.
- **API documentada** con Swagger UI (OpenAPI 3.0) y respuestas JSON uniformes.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, TypeScript (estricto) |
| Base de datos | MongoDB (Atlas o local) con Mongoose |
| Frontend | React 18, TypeScript, Vite |
| Lienzo de dibujo | Konva.js (react-konva) |
| Exportación a PDF | jsPDF (dibujo vectorial del plano con cotas) |
| Animaciones | GSAP |
| Documentación de API | Swagger UI (OpenAPI 3.0) |

## Arquitectura

```
┌─────────────────────────────┐       ┌──────────────────────────────┐
│       Frontend (Vite)       │       │       Backend (Express)      │
│                             │ HTTP  │                              │
│  Páginas y componentes  ────┼──────▶│  Rutas → Controllers          │
│  Lienzo Konva + PDF         │ /api  │  → Services → Mongoose        │
│  Cliente HTTP con token     │       │  Catálogo ventanería          │
└─────────────────────────────┘       └──────────────────────────────┘
```

- El backend aísla la lógica de negocio en `services/` (catálogo, despieces, token), lo que facilita migrar de MongoDB a PostgreSQL en el futuro.
- El frontend solo consume la API a través de `clienteApi.ts`; nunca accede a la base de datos.
- Todas las respuestas de la API usan el formato `{ exito, datos, mensaje }`.

## Estructura del repositorio

```
GlassView/
├── backend/                    # API REST (Express + TypeScript + Mongoose)
│   └── src/
│       ├── config/             # Variables de entorno
│       ├── controllers/        # Orquestación de los endpoints
│       ├── docs/               # Especificación OpenAPI (Swagger)
│       ├── middleware/         # verificarPin, manejarErrores
│       ├── models/             # Esquemas Mongoose (Proyecto, Pieza)
│       ├── routes/             # Definición de rutas
│       └── services/
│           ├── catalogo/       # Catálogo por familias (22 modelos)
│           ├── catalogoVentaneria.ts  # Fachada pública del catálogo
│           ├── despiecePiezas.ts      # Motor de despiece y presets
│           ├── token.ts               # Firma y verificación HMAC
│           └── ...
├── frontend/                   # Interfaz de usuario (React + Vite)
│   └── src/
│       ├── api/                # Cliente HTTP (clienteApi.ts)
│       ├── components/         # Editor y vistas de la aplicación
│       ├── componentes/        # Lienzo Konva y paneles del editor
│       ├── estilos/            # CSS por secciones
│       ├── hooks/              # useZoomPan, useRejilla, useTema
│       ├── pages/              # Acceso, Proyectos, EditorPlano...
│       ├── pdf/                # Exportación de planos a PDF
│       └── utils/              # Geometría y colores del lienzo
└── LICENSE                     # Licencia comercial de IntoCode
```

### Convenciones de código

- Nombres en **español** (camelCase para funciones y variables, PascalCase para tipos y componentes, kebab-case para archivos CSS). No se mezclan idiomas en un mismo identificador.
- Comentarios en español, solo cuando aportan valor.
- TypeScript estricto en ambos paquetes; antes de cerrar un cambio deben compilar backend y frontend (`npm run build`).

## Puesta en marcha

### Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | 20 o superior |
| npm | Con Node |
| MongoDB | Atlas o local |

### Instalación

```bash
# Backend
cd backend
npm install
cp .env.example .env   # configurar variables locales

# Frontend
cd ../frontend
npm install
# .env opcional: en desarrollo se usa el proxy /api de Vite
```

### Variables de entorno

**Backend (`.env`):**

| Variable | Descripción |
|---|---|
| `MONGO_URI` | Conexión a MongoDB (Atlas o local) |
| `PORT` | Puerto del servidor (por defecto 4000) |
| `ACCESS_CODE` | PIN compartido de acceso a la aplicación |
| `SECRET_TOKEN` | Clave para firmar los tokens de acceso (HMAC) |
| `ALLOWED_ORIGINS` | Orígenes permitidos por CORS, separados por comas |

**Frontend (producción):**

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base de la API (sin `/api` final) |

### Ejecución en desarrollo

```bash
# Backend con recarga automática → http://localhost:4000
cd backend
npm run dev

# Frontend → http://localhost:5173
cd frontend
npm run dev
```

En desarrollo, Vite redirige `/api` al backend local mediante proxy.

## Scripts

| Carpeta | Comando | Descripción |
|---|---|---|
| backend | `npm run dev` | API con recarga automática (tsx watch) |
| backend | `npm run build` | Compilación TypeScript a `dist/` |
| backend | `npm start` | Ejecución de la API compilada |
| frontend | `npm run dev` | Servidor de desarrollo Vite |
| frontend | `npm run build` | TypeScript + empaquetado de producción |

## API

Documentación interactiva en **`http://localhost:4000/api/docs`** (Swagger UI). Todas las rutas, salvo `/api/estado` y `/api/auth/verificar-pin`, requieren la cabecera `x-token-acceso`.

| Método y ruta | Descripción |
|---|---|
| `GET /api/estado` | Health check (público) |
| `POST /api/auth/verificar-pin` | Autentica con `{ pin }` y devuelve el token (público) |
| `GET /api/catalogo-ventaneria` | Lista de modelos (id, familia, diseño, ejemplo) |
| `GET /api/catalogo-ventaneria/perfiles` | Perfiles y productos del catálogo por REF |
| `POST /api/catalogo-ventaneria/despiece` | Despiece de un modelo completo por medidas |
| `POST /api/catalogo-ventaneria/despiece-piezas` | Despiece de las piezas dibujadas en un plano |
| `POST /api/catalogo-ventaneria/preset` | Genera las piezas de una plantilla |
| `GET /api/proyectos` · `POST /api/proyectos` | Listar / crear proyecto |
| `GET /api/proyectos/:id` · `PUT` · `DELETE` | Leer / actualizar / eliminar proyecto |

## Catálogo de ventanería

El catálogo vive en `backend/src/services/catalogo/` y se organiza por familia de sistema. Cada modelo define las REFs de perfiles usadas, las **fórmulas de medida** por lado o posición, el espesor del vidrio y los accesorios (empaques, felpas, rodachinas, etc.). El diccionario de perfiles con precios está en `backend/src/services/perfilesVentaneria.ts`.

Para añadir un modelo nuevo:

1. Crear o extender un archivo `modelosFamilia.ts` en `services/catalogo/` usando los helpers de `tipos.ts` (`a`, `h`, `f`, `p`, `v`).
2. Registrarlo en la lista correspondiente de `catalogo.ts`.
3. Dar de alta las REFs nuevas en `perfilesVentaneria.ts` para que el despiece las consolide y pueda tener precio.
4. Verificar con `POST /api/catalogo-ventaneria/despiece` desde Swagger UI.

## Pruebas y verificación

- No hay suite de tests automatizada; la validación se realiza con:
  - peticiones de prueba (`curl` o Swagger UI) contra los endpoints;
  - build de ambos paquetes (`npm run build`) como chequeo de tipos y de empaquetado.
- Si se incorporan tests, los lugares previstos son `backend/test/` (node:test o vitest) y `frontend/src/**/*.test.tsx` (vitest + testing-library).

## Despliegue

- **Frontend**: desplegado en Vercel (`https://glass-view.vercel.app`). En producción debe configurarse `VITE_API_URL` con la URL del backend.
- **Backend**: servicio Node.js que expone `/api`, con `MONGO_URI`, `ACCESS_CODE`, `SECRET_TOKEN` y `ALLOWED_ORIGINS` configurados en el entorno.

## Licencia y créditos

**GlassView** es propiedad de **IntoCode** y se distribuye bajo una [licencia comercial propia](LICENSE): el código es visible para lectura y estudio, pero **está prohibido copiar su funcionalidad o utilizarlo comercialmente** sin una licencia otorgada por IntoCode.

© 2026 **IntoCode** — Desarrollado por **Axl Anzola** y **Dilan Acuña**.
