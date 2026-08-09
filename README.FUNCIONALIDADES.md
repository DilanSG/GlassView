# GlassView2.0 — Funcionalidades

Guía orientada a lo que **la aplicación hace**: cómo se usa cada pantalla, qué calcula el sistema y de dónde salen los datos. Si buscas cómo está implementado internamente, mira la [guía para desarrolladores](README.DESARROLLADORES.md).

## Vista general

1. El usuario entra con un **PIN compartido** (sin cuentas ni contraseñas).
2. Gestiona **proyectos** (cada uno es una obra con su dirección y cliente).
3. Dentro de un proyecto dibuja el **plano** a escala en centímetros reales con herramientas de perfilería.
4. El plano se guarda como **piezas** (perfil, vidrio, rodachina, manija, empaque...), cada una con su REF.
5. El backend calcula el **despiece de la obra**: total de perfiles por REF en metros lineales, vidrios en m², accesorios y empaques, agrupados y con medidas.
6. El plano se puede **exportar a PDF**.

## Acceso (PIN)

- El PIN de acceso está en `ACCESS_CODE` (backend). El primer consumo se autentica en `POST /api/auth/verificar-pin` con un JSON `{ "pin": "..." }`.
- Si el PIN coincide, el backend devuelve un **token firmado con HMAC** y validez de 30 días.
- El cliente guarda ese token en `localStorage` y lo envía en cada petición en el header `x-token-acceso`.
- Los endpoint de proyectos y catálogo están protegidos; solo `/api/estado` y `/api/auth/...` son públicos.

## Proyectos

- `frontend/src/pages/Proyectos.tsx` lista los proyectos existentes (nombre, dirección) y permite abrir/actualizar.
- `frontend/src/pages/NuevoProyecto.tsx` crea el proyecto: nombre, cliente y dirección opcionales; al crearlo, obtiene el `_id` y abre el editor directamente.
- CRUD vía `/api/proyectos` y `/api/proyectos/{id}` (Mongoose).

## Editor de plano

Se abre con una pieza por defecto y un lienzo Konva con vista de retícula.

### Herramientas

| Ícono | Función | Resultado |
|---|---|---|
| Seleccionar | Seleccionar/mover/redimensionar piezas (asas en las esquinas) | Edita posición y tamaño |
| Desplazar plano | Pan del lienzo (mover el plano como papel) | Solo navegación |
| Vidrio | Dibuja un vidrio | Pieza `tipo=vidrio` (se edita ancho × alto) |
| Cabezal | Perfil superior de marco | Línea horizontal |
| Sillar | Perfil inferior | Línea horizontal |
| Jamba | Perfil lateral de marco | Línea vertical |
| Enganche/Traslape | Hoja de ventana | Línea con su grosor |
| Horizontal | Travesaño horizontal intermedio | Línea horizontal |
| Riel | Riel (corredera o batiente) | Línea con grosor |
| U (canal-u) | Canal en U | Línea |
| Rodachina | Punto de rodamiento | Punto (marca pequeña) |
| Manija | Punto de manija | Punto |
| Empaque/Felpa | Empaques/felpa de sellado | Línea |

- **Zoom y pan**: rueda para zoom con cursor como centro, teclas `+`/`-` y barra de controles (con/reinicia).
- **Retícula**: cuadrícula en cm (apaga con tecla de malla) y **medidor de pieza**: en el panel derecho aparece largo/ancho/grosor en cm de la pieza seleccionada.
- **Colores**: tema claro/oscuro con `BotonTema`; los perfiles se pintan según su categoría (verde oscuro/vidrio claro, etc.) en `utils/colores.ts`.
- **Panel piezas**: `PanelPiezas.tsx` lista las piezas del plano para seleccionarlas con un clic.

### Presets (plantillas del catálogo)

- Con la herramienta **Presets** se elige un modelo del catálogo, se pone el clic en el lienzo, y un **diálogo pide el ancho y alto** de la ventana.
- El backend (`POST /api/catalogo-ventaneria/preset`) genera **todas las piezas del modelo con medidas calculadas**: marco exterior (cabezal, sillar, jambas), hojas con sus parales y horizontales, y vidrios encajados — listas para editar.
- Las piezas generadas llevan `dePreset: true`; si la UI se lo permite pueden regenerarse al cambiar tamaño.

## Catálogo de ventanería

- Fuente: tabla de descuentos/medidas de la ventanería real (Excel), transferida a código.
- **22 modelos** repartidos en **7 familias**: `5020`, `744`, `8025`, `7038`, `3831`, `Pb` y `Divibano`, en `backend/src/services/catalogo/modelos*.ts`.
- Cada modelo define **REFs de perfiles, fórmulas de medida** (ej. `anchoDelHueco()`, restas de solapes), **espesor de vidrio** y **accesorios** por unidad (empaques, felpudos, rodachillas...).
- `GET /api/catalogo-ventaneria` devuelve la lista de modelos (id, familia, tipo de diseño: corredera, fijo, batiente, basculante, divibano, alacena; hojas; ejemplo de medidas).
- `GET /api/catalogo-ventaneria/perfiles` los perfiles disponibles por REF con descripción, categoría y precio/m² (datos de `services/perfilesVentaneria.ts`).
- Los endpoints del back en `POST /despiece` (ventanería entera por modelo) y `POST /despiece-piezas` (más libre: sobre las piezas del plano) forman el motor del despiece.

## Despiece automático

- **Por piezas** (`POST /api/catalogo-ventaneria/despiece-piezas`): agrupa las piezas del proyecto por REF:

  | Campo | Qué significa |
  |---|---|
  | `ref`, `descripcion`, `tipo` | Identidad de la pieza |
  | `cantidad` | Número de piezas |
  | `ml` | Metros lineales (largo × cantidad / 100) |
  | `precioMetro` | Precio unitario (si lo tiene) |
  | `subtotal` | ml × precio |
  | vidrios | Cada luna con espesor, ancho, alto, cantidad y m² total |
  | accesorios/emp | Piezas puntuales sin largo (rodachina, manija) agrupadas |

- **Por modelo**: `POST /api/catalogo-ventaneria/despiece` con el id de modelo y las dimensiones aplica las fórmulas del catálogo y devuelve el despiece completo de la ventana (REFs con medidas por lado y posición, vidrios).
- Todos los endpoints del despiece admiten opcionalmente `precios` en la respuesta.

## Exportación a PDF

- `frontend/src/pdf/exportarPlanoPdf.ts` combina **html2canvas** (captura el lienzo) y **jsPDF** (genera el PDF en A4/apaisado con el plano dibujado al escalado).

## Documentación de la API

- Swagger UI en **[http://localhost:4000/api/docs](http://localhost:4000/api/docs)**: lista todos los endpoints con ejemplos y esquemas de respuestas (`${exito, datos, mensaje}`).
- El botón "Authorize" de Swagger sirve para probar con `x-token-acceso` sin escribir cabeceras a mano.

## Limitaciones actuales

- Autenticación: PIN único (sin cuentas, sin roles). El token se guarda en `localStorage`.
- Colección de piezas: el despiece por piezas necesita que las piezas tengan `ref` (REF del catálogo); las piezas sin REF se listan con su `descripcion` pero sin consolidación de precios.
- La pegatina de precios solo aplica a REFs conocidas por `perfilesVentaneria.ts`; `precio` es opcional (si no existe, `subtotal` queda indefinido).
- Catálogo escrito a mano a partir del Excel (no hay admin web de modelos; hay que poner datos nuevos en el backend).

Siguiente: [guía para desarrolladores](README.DESARROLLADORES.md).