# GlassView2.0 — Guía para desarrolladores

Documento de referencia para quien va a **leer, modificar o ampliar** el código. Las convenciones de estilo (identificadores en español, TypeScript estricto, respuestas de API unificadas) están en [AGENTS.md](AGENTS.md). Si buscas qué hace la app para el usuario, ve a [Funcionalidades](README.FUNCIONALIDADES.md).

## Arquitectura general

```
┌──────────────────────────────┐       ┌───────────────────────────────┐
│  frontend (React + Vite)     │       │  backend (Express + TS)       │
│  páginas → componentes       │ HTTP  │  rutas → controllers →        │
│  clienteApi.ts (token)       │──────▶│  services → Mongoose (Mongo)  │
│  konva (lienzo) → jsPDF      │ /api  │  catálogo → despiece          │
└──────────────────────────────┘       └───────────────────────────────┘
```

- El backend delega la lógica de negocio a `services/`; los controllers solo orquestan (así queda aislado de Mongoose de cara a una migración a PostgreSQL).
- El frontend solo habla con la API vía `clienteApi.ts`, nunca con Mongo.
- Respuestas de la API siempre en JSON con la forma `{ exito, datos, mensaje }`.

## Backend (`backend/src/`)

### Estructura

| Carpeta | Contenido |
|---|---|
| `config/` | `variablesEntorno.ts` — lee `.env` y expone valores con defaults. |
| `controllers/` | `auth.controller.ts`, `catalogo.controller.ts`, `proyectos.controller.ts`. |
| `middleware/` | `verificarPin.ts` (JWT/HMAC por header), `manejarErrores.ts` (transforma errores a envelope). |
| `models/` | Schemas Mongoose: `Pieza.ts`, `Proyecto.ts`. |
| `routes/` | `auth.routes.ts`, `catalogo.routes.ts`, `proyectos.routes.ts`. |
| `services/` | Lógica de negocio: token, mongo, catálogo de ventanería, despieces, presets. |
| `docs/` | `apiEspecificacion.ts` — spec OpenAPI 3.0 que alimenta Swagger UI. |
| `index.ts` | Bootstrap + arranque del servidor. |
| `app.ts` | Composición de Express (CORS, rutas, middleware, Swagger). |

### Flujo de una petición

1. `app.ts` registra los routers en `/api/auth`, `/api/catalogo-ventaneria` y `/api/proyectos`.
2. Los routers de catálogo y proyectos están envueltos por `verificarPin` (Header `x-token-acceso`).
3. El controller procesa, invoca services y responde `res.json({ exito, datos, mensaje })`.
4. Si algo falla para, `manejarErrores` devuelve el formato uniforme con el código adecuado.

### Seguridad: token de acceso

- `services/token.ts` — `firmarToken(pin, secreto)` crea un token HMAC con `exp` a 30 días cuando el PIN coincide; `verificarToken` valida firma y expiración.
- `middleware/verificarPin.ts` — lee `x-token-acceso`; si falta o es inválido responde `401` con envelope.
- Variables sensibles: `ACCESS_CODE` (el PIN) y `SECRET_TOKEN` (clave de firma) — nunca deben versionarse.

### Catálogo de ventanería (`services/catalogo/`)

```
catalogo/
├── tipos.ts            # Tipos base y helpers de construcción (a, h, f, p, v)
├── modelos5020.ts      # familia 5020
├── modelos744.ts       # familia 744
├── modelos8025.ts      # familia 8025
├── modelos7038.ts      # familia 7038
├── modelos3831.ts      # familia 3831
├── modelosPb.ts        # familia Pb
├── modelosDivibano.ts  # familia Divibano
├── catalogo.ts         # Agrupa los modelos + consultas (listar, obtener por id)
└── despiece.ts         # calcularDespieceVentaneria (fórmulas de medidas por modelo)
```

- `catalogoVentaneria.ts` en `services/` es una **fachada** con re-exports explícitos desde `catalogo/`, para no romper el import público.
- Cada modelo (22 en total) define:
  - REFs de perfiles usados,
  - **fórmulas de medida** por lado/posición (`FormulaMedida`),
  - espesor de vidrio y accesorios (empaque, felpas, rodachinas...).
- Los helpers de `tipos.ts` (`a`, `h`, `f`, `p`, `v`) son atajos para declarar fórmulas: **a**ncho hueco, **h**alto, **f**órmula, **p**ieza, **v**idrio.

### Motor de despiece

- `services/catalogoVentaneria.ts` (despiece.ts) — `calcularDespieceVentaneria(modelo, anchoCm, altoCm)` usa las fórmulas del modelo y devuelve el despiece con medidas resueltas.
- `services/despiecePiezas.ts` — motor sobre piezas arbitrarias del plano:
- agrupa por `ref` y suma `cantidad` y metros lineales (`largo × cantidad / 100`);
- los vidrios se acumulan en m² (`ancho × alto × cantidad`);
- incluye precios si el perfil está en `perfilesVentaneria.ts`;
- contiene el generador de **presets** (todas las piezas de una plantilla a partir de un modelo).
- `services/perfilesVentaneria.ts` — catálogo de REF → descripción, categoría y precio por metro.

### Modelos de datos

- `Proyecto.ts`: `{ nombre, cliente?, direccion?, fechaCreacion, piezas: [Pieza] }`.
- `Pieza.ts`: `{ id, tipo, ref, descripcion?, x, y, largoCm, anchoCm, altoCm, orientacion: horizontal|vertical|punto, espesorMm, cantidad, dePreset? }`.
- Nota: los documentos creados en versiones antiguas pueden tener un campo `huecos` huérfano; el código actual lo ignora.

### Endpoints (resumen)

| Método y ruta | Público | Descripción |
|---|---|---|
| `GET /api/estado` | sí | Health check. |
| `POST /api/auth/verificar-pin` | sí | Autentica con `{ pin }` → token. |
| `GET /api/catalogo-ventaneria` | no | Lista de modelos (id, familia, diseño). |
| `GET /api/catalogo-ventaneria/perfiles` | no | Perfiles del catálogo por REF. |
| `POST /api/catalogo-ventaneria/despiece` | no | Despiece de un modelo completo. |
| `POST /api/catalogo-ventaneria/despiece-piezas` | no | Despiece de piezas arbitrarias. |
| `POST /api/catalogo-ventaneria/preset` | no | Genera piezas de plantilla. |
| `GET/POST /api/proyectos` | no | Listar / crear proyecto. |
| `GET/PUT/DELETE /api/proyectos/:id` | no | Leer / actualizar / borrar. |

Documentación completa e interactiva: `/api/docs` (Swagger UI).

### Añadir un nuevo modelo al catálogo

1. Añadir el archivo `modelosNuevaFamilia.ts` en `services/catalogo/` (o extender uno existente) usando los helpers de `tipos.ts`.
2. Añadir su lista de modelos a `catalogo.ts` (const `/ listas de modelos`).
3. Si usa REFs nuevas, darlas de alta en `services/perfilesVentaneria.ts` para que el despiece las consolide y pueda tener precio.
4. Verificar en Swagger: probar `POST /despiece` con el nuevo modelo.

## Frontend (`frontend/src/`)

### Estructura

| Carpeta | Contenido |
|---|---|
| `pages/` | `Acceso.tsx` (PIN), `Proyectos.tsx`, `NuevoProyecto.tsx`, `EditorPlano.tsx`. |
| `components/` | Capa alta del editor: `DisenoProyecto.tsx`, `LienzoPlano.tsx`, `PanelPiezas.tsx`, `BarraNavegacion.tsx`, `Estructura.tsx`, `BotonTema.tsx`. |
| `componentes/lienzo/` | Primitivas de canvas: `PiezasKonva.tsx`, `RejillaKonva.tsx`, `ControlesZoom.tsx`, `CotasKonva.tsx`, `AsasSeleccion.tsx`, `MedidorPieza.tsx`, `SelectorRef.tsx`, `DialogoPreset.tsx`, `AyudaLienzo.tsx`, `IconoHerramienta.tsx`. |
| `hooks/` | `useZoomPan.ts`, `useRejilla.ts`, `useTema.ts`. |
| `utils/` | `geometria.ts` (redondeos y conversiones), `colores.ts` (paleta por categoría). |
| `pdf/` | `exportarPlanoPdf.ts` (html2canvas + jsPDF). |
| `api/` | `clienteApi.ts` — cliente HTTP con token. |
| `tipos/` | Tipos compartidos del plano (`tipos/lienzo.ts`) y del dominio (`tipos.ts`). |
| `constantes.ts` | Definición de `HerramientaCad` y las herramientas de la barra. |
| `estilos/` | CSS separados (app, editor, panel, despiece). |

### Flujos clave

- **Rutas protegidas**: `App.tsx` comprueba si hay token en `localStorage`; si no, redirige a `/acceso`.
- **clienteApi.ts**: lee el token del `storage`, lo inyecta en `x-token-acceso` y usa `VITE_API_URL` (producción) o el proxy `/api` (dev).
- **Lienzo**: `LienzoPlano.tsx` es el `Stage` de Konva; usa `useRejilla`/`useZoomPan` para la vista y `PiezasKonva` para el render. El estado local de la herramienta `(seleccion, mano, vidrio, ...)` está en el componente; los presets se activan con la herramienta `preset-<modeloId>` y se resuelven con `generarPreset`.
- **Pieza seleccionada**: el medidor del panel derecho (`MedidorPieza`) lee la pieza seleccionada de `DisenoProyecto` y la muestra en cm.
  - El `DisenoProyecto` mantiene el estado `piezas` y lo sincroniza con la API (GET al abrir, PUT al guardar).
- **PDF**: `exportarPlanoPdf` captura el `div` del lienzo con html2canvas, escala y dibuja el PDF con jsPDF.

### Convenciones

- Nombres en **español** (camelCase para funciones/variables, PascalCase para tipos/components, kebab-case para archivos CSS).
- Nunca mezclar idiomas en un identificador (`obtenerGlassWidth` prohibido).
- Comentarios solo cuando aportan valor, en español.
- Ejecutar `npm run build` en backend **y** frontend antes de dar una tarea por cerrada.

## Testing

- No hay suite de tests automatizada todavía; la validación se hace con:
  - `curl` contra los endpoints (`node dist/index.js` + json de prueba).
  - Swagger UI en `/api/docs` para probar peticiones sin cabeceras.
  - Build de ambos paquetes (`npm run build`) como chequeo de tipos.
Dónde añadir tests si se decide hacerlos: `backend/test/` (node:test o vitest) y `frontend/src/**/*.test.tsx` (vitest + testing-library).

## Variables de entorno

| Variable | Dónde | Uso |
|---|---|---|
| `MONGO_URI` | backend | Conexión Mongoose. |
| `PORT` | backend | Puerto del servidor (default 4000). |
| `ACCESS_CODE` | backend | PIN de acceso. |
| `SECRET_TOKEN` | backend | Firma HMAC del token. |
| `ALLOWED_ORIGINS` | backend | CORS permitidos. |
| `VITE_API_URL` | frontend | URL de la API en producción (opcional; dev usa proxy). |

## Entrega del código

```bash
# 1. Backend: type-check completo
cd backend && npm run build    # tsc → dist/
# 2. Frontend: type-check + bundle
cd ../frontend && npm run build  # tsc -b && vite build
```

Ver enlaces: [Backend README y estructura raíz](../README.md) · [Funcionalidades](README.FUNCIONALIDADES.md) · [AGENTS.md](AGENTS.md).