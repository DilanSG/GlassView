# GlassView

Sistema profesional para el **diseño de planos de instalaciones de cristalería** y la generación automática de su **despiece**: perfiles, vidrio, herrajes y empaque, con medidas reales calculadas a partir de un catálogo de modelos de ventanería.

> **GlassView es un producto comercial de IntoCode.** El código fuente es público para su lectura y estudio, pero su funcionalidad no puede copiarse ni emplearse con fines comerciales sin una licencia de IntoCode. Ver [Licencia](#licencia).

---

## Índice

- [Características](#características)
- [Cuentas, prueba y suscripción](#cuentas-prueba-y-suscripción)
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

- **Landing pública de venta**: página de inicio con características, precios y llamada a la acción; el precio se muestra en la moneda del país del visitante.
- **Cuentas de usuario**: registro e inicio de sesión con correo y contraseña (hash scrypt), perfil editable, cambio de contraseña y eliminación de cuenta.
- **Prueba gratuita de 10 días** por cuenta; al terminar, las funciones de dibujo quedan bloqueadas hasta activar la suscripción.
- **Suscripción de 10 USD/mes** con precio localizado por país (API de tipos de cambio en vivo con respaldo local) y pago simulado listo para conectar una pasarela real.
- **Panel de administración**: listar, crear, editar, bloquear y eliminar usuarios; el administrador no puede ver los proyectos de nadie.
- **Proyectos privados por usuario**: cada cuenta solo ve y edita sus propios planos.
- **Lienzo de dibujo a escala real** en centímetros, con retícula de precisión, zoom, desplazamiento y herramientas de perfilería (cabezales, sillares, jambas, hojas, rieles, vidrios, rodachinas, manijas y empaques).
- **Plantillas por modelo**: generan automáticamente todas las piezas de una ventana (marco, hojas y vidrios) con las medidas del fabricante.
- **Catálogo de ventanería integrado**: 22 modelos reales en 7 familias (5020, 744, 8025, 7038, 3831, P.B. y Divibano), con fórmulas de medida propias.
- **Despiece automático**: consolidación por REF en metros lineales, vidrio en metros cuadrados, accesorios y empaques, con precios opcionales.
- **Exportación a PDF**: plano vectorial en A5 (horizontal o vertical) con cotas en centímetros en los cuatro lados.
- **API documentada** con Swagger UI (OpenAPI 3.0) y respuestas JSON uniformes.

## Cuentas, prueba y suscripción

1. Cualquier persona puede **registrarse** desde `/registro`; la cuenta arranca con una prueba de `TRIAL_DAYS` días (10 por defecto).
2. Durante la prueba (o con la suscripción activa) el usuario puede usar el catálogo y sus proyectos. Al expirar, esas rutas responden `402 SUSCRIPCION_REQUERIDA` y el frontend redirige a **Facturación**.
3. En `/facturacion` y en la landing se muestra el precio convertido a la moneda del país de compra. La detección usa, en este orden: parámetro `?pais=` (la landing lo envía según la zona horaria y el idioma), cabeceras geográficas del proxy (`cf-ipcountry`, `x-vercel-ip-country`), geolocalización por IP y el idioma del navegador.
4. `POST /api/facturacion/pagar` **simula** el cobro, activa 30 días y guarda el comprobante (referencia, importe local y equivalente en USD). Es el punto exacto donde se conectará la pasarela real (Stripe, MercadoPago, etc.).
5. El **administrador** (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) puede gestionar cuentas desde `/admin/usuarios`, pero nunca accede a los proyectos ajenos.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Backend | Node.js, Express, TypeScript (estricto) |
| Base de datos | MongoDB (Atlas o local) con Mongoose |
| Autenticación | Token HMAC + hash de contraseñas con scrypt (`node:crypto`) |
| Divisas | `open.er-api.com` en vivo con caché y tabla de respaldo; geolocalización por IP |
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
│  Landing + Páginas y        │──────▶│  Rutas → Controllers          │
│  componentes                │ /api  │  → Services → Mongoose        │
│  Sesión (contexto) + token  │       │  Cuentas, plan, catálogo      │
└─────────────────────────────┘       └──────────────────────────────┘
```

- El backend aísla la lógica de negocio en `services/` (catálogo, despieces, token, contraseñas, suscripción, divisas), lo que facilita migrar de MongoDB a PostgreSQL en el futuro.
- El frontend consume la API a través de `clienteApi.ts`; nunca accede a la base de datos. La sesión vive en `contextos/SesionContexto.tsx`.
- Todas las respuestas de la API usan el formato `{ exito, datos, mensaje }` y añaden `codigo` en los errores de sesión/plan.

## Estructura del repositorio

```
GlassView/
├── backend/                    # API REST (Express + TypeScript + Mongoose)
│   └── src/
│       ├── config/             # Variables de entorno
│       ├── controllers/        # Orquestación de los endpoints (auth, facturación, ...)
│       ├── docs/               # Especificación OpenAPI (Swagger)
│       ├── middleware/         # autenticar, requiereSuscripcion, soloAdmin, manejarErrores
│       ├── models/             # Esquemas Mongoose (Usuario, Proyecto, Pieza)
│       ├── routes/             # Definición de rutas
│       └── services/
│           ├── catalogo/       # Catálogo por familias (22 modelos)
│           ├── bootstrap.ts           # Cuenta administradora inicial
│           ├── contrasenas.ts         # Hash y verificación con scrypt
│           ├── divisas.ts             # Países, tasas de cambio y detección de país
│           ├── suscripcion.ts         # Estado de prueba/suscripción y usuario público
│           ├── token.ts               # Firma y verificación HMAC
│           └── ...
├── frontend/                   # Interfaz de usuario (React + Vite)
│   └── src/
│       ├── api/                # Cliente HTTP (clienteApi.ts)
│       ├── components/         # Navegación, avisos y piezas de la landing
│       ├── componentes/        # Lienzo Konva y paneles del editor
│       ├── contextos/          # Sesión del usuario (SesionContexto.tsx)
│       ├── estilos/            # CSS por secciones (incluye marketing.css)
│       ├── hooks/              # useZoomPan, useRejilla, useTema
│       ├── pages/              # Inicio, Acceso, Registro, Proyectos, Facturación, Perfil, ...
│       ├── pdf/                # Exportación de planos a PDF
│       └── utils/              # Geometría, colores y formato
├── LICENSE                     # Licencia comercial de IntoCode
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
| `SECRET_TOKEN` | Clave para firmar los tokens de sesión (HMAC) |
| `TRIAL_DAYS` | Días de prueba gratuita por cuenta (por defecto 10) |
| `PRICE_USD` | Precio mensual de la suscripción en dólares (por defecto 10) |
| `ADMIN_EMAIL` | Correo de la cuenta administradora que se crea al arrancar (opcional) |
| `ADMIN_PASSWORD` | Contraseña de esa cuenta administradora (opcional) |
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

Documentación interactiva en **`http://localhost:4000/api/docs`** (Swagger UI). Las rutas protegidas requieren la cabecera `x-token-acceso` con el token que devuelven el registro o el login.

| Método y ruta | Descripción |
|---|---|
| `GET /api/estado` | Health check (público) |
| `POST /api/auth/registro` | Crea la cuenta y arranca la prueba gratuita (público) |
| `POST /api/auth/login` | Inicia sesión y devuelve el token (público) |
| `GET` · `PUT /api/auth/perfil` | Lee / actualiza el perfil del usuario |
| `PUT /api/auth/contrasena` | Cambia la contraseña actual |
| `DELETE /api/auth/cuenta` | Elimina la cuenta y sus proyectos |
| `GET /api/facturacion/precio` | Precio mensual convertido a la moneda del país (público) |
| `GET /api/facturacion` | Estado de facturación del usuario |
| `POST /api/facturacion/pagar` | Simula el pago y activa 30 días de suscripción |
| `GET` · `POST /api/auth/usuarios` | (Admin) Lista / crea cuentas |
| `GET` · `PUT` · `DELETE /api/auth/usuarios/:id` | (Admin) Lee / actualiza / elimina una cuenta |
| `GET /api/catalogo-ventaneria` | Lista de modelos (id, familia, diseño, ejemplo) |
| `GET /api/catalogo-ventaneria/perfiles` | Perfiles y productos del catálogo por REF |
| `POST /api/catalogo-ventaneria/despiece` | Despiece de un modelo completo por medidas |
| `POST /api/catalogo-ventaneria/despiece-piezas` | Despiece de las piezas dibujadas en un plano |
| `POST /api/catalogo-ventaneria/preset` | Genera las piezas de una plantilla |
| `GET /api/proyectos` · `POST /api/proyectos` | Lista / crea proyectos del usuario |
| `GET /api/proyectos/:id` · `PUT` · `DELETE` | Lee / actualiza / elimina un proyecto propio |

Los endpoints de catálogo y proyectos responden `402 SUSCRIPCION_REQUERIDA` cuando la prueba terminó y no hay suscripción activa; los de usuarios responden `403 PERMISOS_INSUFICIENTES` si quien llama no es administrador.

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
- Flujo recomendado de verificación manual: registrar una cuenta, comprobar los 10 días de prueba, vencer la prueba desde el panel admin y confirmar el `402`, pagar (simulado) y comprobar la reactivación.
- Si se incorporan tests, los lugares previstos son `backend/test/` (node:test o vitest) y `frontend/src/**/*.test.tsx` (vitest + testing-library).

## Despliegue

- **Frontend**: desplegado en Vercel (`https://glass-view.vercel.app`). En producción debe configurarse `VITE_API_URL` con la URL del backend.
- **Backend**: servicio Node.js que expone `/api`, con `MONGO_URI`, `SECRET_TOKEN`, `TRIAL_DAYS`, `PRICE_USD`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` y `ALLOWED_ORIGINS` configurados en el entorno.
- Detrás de un proxy (Vercel, Cloudflare, Nginx) la detección de país aprovecha las cabeceras geográficas; si no, se resuelve por IP o idioma.

## Licencia y créditos

**GlassView** es propiedad de **IntoCode** y se distribuye bajo una [licencia comercial propia](LICENSE): el código es visible para lectura y estudio, pero **está prohibido copiar su funcionalidad o utilizarlo comercialmente** sin una licencia otorgada por IntoCode.

© 2026 **IntoCode** — Desarrollado por **Axl Anzola** y **Dilan Acuña**.
