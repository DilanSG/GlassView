/**
 * Especificación OpenAPI 3.0 de la API de GlassView2.0.
 *
 * Se sirve en GET /api/docs mediante swagger-ui-express.
 * Todas las rutas (excepto /estado y /auth/verificar-pin) exigen el token
 * de acceso en la cabecera `x-token-acceso`.
 */

const autenticacion = {
  type: 'apiKey',
  in: 'header',
  name: 'x-token-acceso',
  description:
    'Token firmado con HMAC que devuelve POST /auth/verificar-pin al introducir el PIN correcto. Caduca a los 30 días.',
} as const;

export const especificacionApi = {
  openapi: '3.0.0',
  info: {
    title: 'GlassView2.0 API',
    version: '0.1.0',
    description:
      'API de planos de instalaciones de cristalería: catálogo de modelos de ventanería, despieces y CRUD de proyectos.\n\n' +
      'Todas las respuestas usan el mismo contenedor `{ exito, datos, mensaje }`. ' +
      'Las rutas protegidas requieren la cabecera `x-token-acceso` con el token obtenido al verificar el PIN.',
  },
  servers: [{ url: '/api', description: 'Servidor GlassView2.0' }],
  tags: [
    { name: 'Estado', description: 'Salud del servidor' },
    { name: 'Autenticación', description: 'Acceso por PIN compartido' },
    { name: 'Catálogo de ventanería', description: 'Modelos, perfiles, despieces y plantillas (presets)' },
    { name: 'Proyectos', description: 'CRUD de proyectos de instalación' },
  ],
  paths: {
    '/estado': {
      get: {
        tags: ['Estado'],
        summary: 'Comprueba que el backend está en línea',
        security: [],
        responses: {
          '200': {
            description: 'Servidor en línea',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    estado: { type: 'string', example: 'ok' },
                    mensaje: { type: 'string', example: 'GlassView backend en línea.' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/verificar-pin': {
      post: {
        tags: ['Autenticación'],
        summary: 'Verifica el PIN compartido y devuelve el token de acceso',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['pin'],
                properties: {
                  pin: { type: 'string', description: 'PIN compartido (ACCESS_CODE)', example: '1234' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'PIN correcto: se devuelve el token firmado',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RespuestaApi',
                },
                example: {
                  exito: true,
                  datos: { token: '1234.1780000000000.6f2a...' },
                  mensaje: 'Acceso concedido.',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
        },
      },
    },
    '/catalogo-ventaneria': {
      get: {
        tags: ['Catálogo de ventanería'],
        summary: 'Lista los modelos de ventanería para la paleta del lienzo',
        description:
          'Devuelve los 22 modelos del catálogo (id, nombre, sistema, diseño y medidas de ejemplo) agrupables por sistema: 5020, 744, 8025, 7038, 3831, P.B. y DIVIBANO.',
        responses: {
          '200': {
            description: 'Catálogo cargado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: [
                    {
                      id: '5020-2-hojas',
                      nombre: '5020 2 hojas',
                      sistema: '5020',
                      diseno: { tipo: 'corredera', apiladas: false, hojas: [{ tipo: 'corredera', proporcion: 0.5 }] },
                      ejemplo: { ancho: 109.2, alto: 43.6 },
                    },
                  ],
                  mensaje: 'Catálogo de ventanería cargado.',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
    '/catalogo-ventaneria/perfiles': {
      get: {
        tags: ['Catálogo de ventanería'],
        summary: 'Lista los perfiles y productos disponibles para dibujar',
        description:
          'Diccionario de REFs (ref, descripción, categoría, sistema y precios) usado por la paleta del lienzo: cada herramienta filtra las REFs compatibles.',
        responses: {
          '200': {
            description: 'Perfiles cargados',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: [
                    { ref: 'ALNA-144', descripcion: 'CABEZAL', categoria: 'cabezal', sistema: '5020', precioMetro: 8.5 },
                  ],
                  mensaje: 'Perfiles cargados.',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
    '/catalogo-ventaneria/despiece': {
      post: {
        tags: ['Catálogo de ventanería'],
        summary: 'Calcula el despiece de un modelo a partir de sus medidas',
        description:
          'Evalúa las fórmulas de corte del modelo (REFs, vidrios y accesorios) para el ancho y alto dados. El empaque se deriva del perímetro de los vidrios con el factor del modelo.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modeloId', 'anchoCm', 'altoCm'],
                properties: {
                  modeloId: { type: 'string', description: 'Identificador del modelo del catálogo', example: '5020-2-hojas' },
                  anchoCm: { type: 'number', minimum: 0.1, description: 'Ancho de la ventana en cm', example: 109.2 },
                  altoCm: { type: 'number', minimum: 0.1, description: 'Alto de la ventana en cm', example: 43.6 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Despiece calculado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: {
                    modeloId: '5020-2-hojas',
                    modeloNombre: '5020 2 hojas',
                    anchoCm: 109.2,
                    altoCm: 43.6,
                    areaM2: 0.48,
                    piezas: [{ ref: 'ALNA-144', descripcion: 'CABEZAL', medidaCm: 109.2, cantidad: 1, corteGrados: 90, ml: 1.09 }],
                    vidrios: [{ descripcion: 'HOJAS CORR.', material: 'vidrio', espesorMm: 4, altoCm: 34.1, anchoCm: 51.2, cantidad: 2 }],
                    empaqueMl: 7.3,
                    accesorios: [{ seccion: 'TORNILLERIA', descripcion: '8 X 3/4¨', cantidad: 8 }],
                    totalMl: 8.4,
                  },
                  mensaje: 'Despiece calculado.',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/PeticionInvalida' },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '404': { $ref: '#/components/responses/NoEncontrado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
    '/catalogo-ventaneria/despiece-piezas': {
      post: {
        tags: ['Catálogo de ventanería'],
        summary: 'Agrupa las piezas dibujadas en el plano por REF',
        description:
          'Recibe las piezas del proyecto y produce el despiece de la obra: líneas por REF (con metros lineales y subtotales), vidrios en m² y totales.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['piezas'],
                properties: {
                  piezas: {
                    type: 'array',
                    description: 'Piezas dibujadas en el plano (igual que el campo piezas del proyecto)',
                    items: { $ref: '#/components/schemas/PiezaPlano' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Despiece por piezas calculado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: {
                    lineas: [{ ref: 'ALNA-144', descripcion: 'CABEZAL', tipo: 'perfil', cantidad: 2, ml: 2.18, precioMetro: 8.5, subtotal: 18.53 }],
                    vidrios: [{ descripcion: 'VIDRIO', espesorMm: 4, anchoCm: 100, altoCm: 40, cantidad: 1, m2: 0.4 }],
                    totalMl: 2.18,
                    totalVidrioM2: 0.4,
                    totalHerrajes: 2,
                  },
                  mensaje: 'Despiece por piezas calculado.',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/PeticionInvalida' },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
    '/catalogo-ventaneria/preset': {
      post: {
        tags: ['Catálogo de ventanería'],
        summary: 'Genera las piezas de una plantilla (preset) de un modelo',
        description:
          'Coloca automáticamente el marco, las hojas y los vidrios de un modelo con la disposición real (fórmulas del catálogo) para las medidas indicadas. El lienzo las inserta al arrastrar la plantilla.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['modeloId', 'anchoCm', 'altoCm'],
                properties: {
                  modeloId: { type: 'string', example: '5020-2-hojas' },
                  anchoCm: { type: 'number', minimum: 0.1, example: 300 },
                  altoCm: { type: 'number', minimum: 0.1, example: 150 },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Preset generado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: [{ id: 'pieza-1710000000000-abc12', tipo: 'perfil', ref: 'ALNA-144', descripcion: 'CABEZAL', x: 0, y: 0, largoCm: 300, anchoCm: 0, altoCm: 0, orientacion: 'horizontal', espesorMm: 4, cantidad: 1, dePreset: true }],
                  mensaje: 'Preset generado.',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/PeticionInvalida' },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
    '/proyectos': {
      get: {
        tags: ['Proyectos'],
        summary: 'Lista todos los proyectos',
        description: 'Devuelve los proyectos ordenados por fecha de creación descendente.',
        responses: {
          '200': {
            description: 'Proyectos cargados',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: [{ _id: '65f0a1b2c3d4e5f6a7b8c9d0', nombre: 'Escalera edificio San Martín', cliente: 'Inmobiliaria Sur', direccion: 'Av. Los Pinos 123', fechaCreacion: '2025-03-12T10:00:00.000Z', piezas: [] }],
                  mensaje: 'Proyectos cargados.',
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
      post: {
        tags: ['Proyectos'],
        summary: 'Crea un proyecto nuevo',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['nombre'],
                properties: {
                  nombre: { type: 'string', description: 'Nombre del proyecto', example: 'Escalera edificio San Martín' },
                  cliente: { type: 'string', example: 'Inmobiliaria Sur' },
                  direccion: { type: 'string', example: 'Av. Los Pinos 123' },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Proyecto creado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
                example: {
                  exito: true,
                  datos: { _id: '65f0a1b2c3d4e5f6a7b8c9d0', nombre: 'Escalera edificio San Martín', cliente: 'Inmobiliaria Sur', direccion: 'Av. Los Pinos 123', fechaCreacion: '2025-03-12T10:00:00.000Z', piezas: [] },
                  mensaje: 'Proyecto creado.',
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/PeticionInvalida' },
          '401': { $ref: '#/components/responses/NoAutorizado' },
        },
      },
    },
    '/proyectos/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Identificador de Mongo del proyecto',
          example: '65f0a1b2c3d4e5f6a7b8c9d0',
        },
      ],
      get: {
        tags: ['Proyectos'],
        summary: 'Obtiene un proyecto por su id',
        responses: {
          '200': {
            description: 'Proyecto encontrado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '404': { $ref: '#/components/responses/NoEncontrado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
      put: {
        tags: ['Proyectos'],
        summary: 'Actualiza un proyecto (p. ej. sus piezas)',
        description:
          'Actualización parcial: se pueden enviar solo los campos a modificar. El lienzo lo usa para guardar las piezas dibujadas.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  nombre: { type: 'string' },
                  cliente: { type: 'string' },
                  direccion: { type: 'string' },
                  piezas: {
                    type: 'array',
                    description: 'Piezas del plano',
                    items: { $ref: '#/components/schemas/PiezaPlano' },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Proyecto actualizado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
              },
            },
          },
          '400': { $ref: '#/components/responses/PeticionInvalida' },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '404': { $ref: '#/components/responses/NoEncontrado' },
        },
      },
      delete: {
        tags: ['Proyectos'],
        summary: 'Elimina un proyecto',
        responses: {
          '200': {
            description: 'Proyecto eliminado',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RespuestaApi' },
              },
            },
          },
          '401': { $ref: '#/components/responses/NoAutorizado' },
          '404': { $ref: '#/components/responses/NoEncontrado' },
          '500': { $ref: '#/components/responses/ErrorServidor' },
        },
      },
    },
  },
  components: {
    securitySchemes: { acceso: autenticacion },
    schemas: {
      RespuestaApi: {
        type: 'object',
        description: 'Contenedor uniforme de todas las respuestas de la API.',
        properties: {
          exito: { type: 'boolean', description: 'true si la operación se completó correctamente' },
          datos: { description: 'Carga útil de la respuesta (null en errores)' },
          mensaje: { type: 'string', description: 'Mensaje legible del resultado' },
        },
        required: ['exito', 'datos', 'mensaje'],
      },
      PiezaPlano: {
        type: 'object',
        description: 'Pieza individual dibujada en el plano: perfil, vidrio, herraje o punto.',
        properties: {
          id: { type: 'string', description: 'Identificador único generado por el lienzo' },
          tipo: { type: 'string', description: 'Tipo de la pieza (p. ej. perfil, vidrio, herraje)' },
          ref: { type: 'string', description: 'REF del perfil o producto' },
          descripcion: { type: 'string' },
          x: { type: 'number', description: 'Posición X en cm sobre el plano' },
          y: { type: 'number', description: 'Posición Y en cm sobre el plano' },
          largoCm: { type: 'number', description: 'Largo (perfiles horizontales/verticales)' },
          anchoCm: { type: 'number', description: 'Ancho (vidrios y rectángulos)' },
          altoCm: { type: 'number', description: 'Alto (vidrios y rectángulos)' },
          orientacion: { type: 'string', enum: ['horizontal', 'vertical', 'punto'] },
          espesorMm: { type: 'number', default: 4 },
          cantidad: { type: 'number', default: 1 },
          dePreset: { type: 'boolean', default: false, description: 'true si vino de una plantilla' },
        },
        required: ['id', 'tipo', 'ref'],
      },
      Proyecto: {
        type: 'object',
        description: 'Proyecto de instalación con las piezas de su plano.',
        properties: {
          _id: { type: 'string' },
          nombre: { type: 'string' },
          cliente: { type: 'string' },
          direccion: { type: 'string' },
          fechaCreacion: { type: 'string', format: 'date-time' },
          piezas: {
            type: 'array',
            items: { $ref: '#/components/schemas/PiezaPlano' },
          },
        },
        required: ['_id', 'nombre', 'piezas'],
      },
      ModeloVentaneria: {
        type: 'object',
        description: 'Modelo de ventanería del catálogo (22 modelos en 7 sistemas).',
        properties: {
          id: { type: 'string', example: '5020-2-hojas' },
          nombre: { type: 'string', example: '5020 2 hojas' },
          sistema: { type: 'string', example: '5020', description: '5020, 744, 8025, 7038, 3831, P.B. o DIVIBANO' },
          diseno: {
            type: 'object',
            properties: {
              tipo: { type: 'string', enum: ['corredera', 'fijo', 'batiente', 'basculante', 'divibano', 'alacena'] },
              apiladas: { type: 'boolean' },
              hojas: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    tipo: { type: 'string', enum: ['corredera', 'fija', 'batiente', 'basculante'] },
                    proporcion: { type: 'number' },
                  },
                },
              },
            },
          },
          ejemplo: {
            type: 'object',
            description: 'Medidas de ejemplo extraídas del Excel',
            properties: { ancho: { type: 'number' }, alto: { type: 'number' } },
          },
        },
        required: ['id', 'nombre', 'sistema', 'diseno', 'ejemplo'],
      },
      PerfilVentaneria: {
        type: 'object',
        properties: {
          ref: { type: 'string' },
          descripcion: { type: 'string' },
          categoria: { type: 'string', enum: ['vidrio', 'cabezal', 'sillar', 'jamba', 'hoja', 'horizontal', 'riel', 'canal-u', 'rodachina', 'manija', 'empaque', 'tubo', 'otro'] },
          sistema: { type: 'string' },
          precioMetro: { type: 'number' },
          precioTramo: { type: 'number' },
        },
        required: ['ref', 'descripcion', 'categoria', 'sistema'],
      },
      PiezaDespiece: {
        type: 'object',
        description: 'Línea del despiece de un modelo del catálogo.',
        properties: {
          ref: { type: 'string' },
          descripcion: { type: 'string' },
          medidaCm: { type: 'number' },
          cantidad: { type: 'number' },
          corteGrados: { type: 'number' },
          ml: { type: 'number', description: 'Metros lineales (medida × cantidad / 100)' },
        },
      },
      VidrioDespiece: {
        type: 'object',
        properties: {
          descripcion: { type: 'string' },
          material: { type: 'string', enum: ['vidrio', 'acrilico'] },
          espesorMm: { type: 'number' },
          altoCm: { type: 'number' },
          anchoCm: { type: 'number' },
          cantidad: { type: 'number' },
        },
      },
      AccesorioDespiece: {
        type: 'object',
        properties: {
          seccion: { type: 'string' },
          descripcion: { type: 'string' },
          cantidad: { type: 'number' },
        },
      },
      DespieceVentaneria: {
        type: 'object',
        description: 'Despiece completo de un modelo del catálogo para unas medidas dadas.',
        properties: {
          modeloId: { type: 'string' },
          modeloNombre: { type: 'string' },
          anchoCm: { type: 'number' },
          altoCm: { type: 'number' },
          areaM2: { type: 'number' },
          piezas: { type: 'array', items: { $ref: '#/components/schemas/PiezaDespiece' } },
          vidrios: { type: 'array', items: { $ref: '#/components/schemas/VidrioDespiece' } },
          empaqueMl: { type: 'number', description: 'Empaque derivado del perímetro de los vidrios' },
          accesorios: { type: 'array', items: { $ref: '#/components/schemas/AccesorioDespiece' } },
          totalMl: { type: 'number' },
        },
      },
      LineaPiezaDespiece: {
        type: 'object',
        description: 'Línea del despiece por piezas de un proyecto.',
        properties: {
          ref: { type: 'string' },
          descripcion: { type: 'string' },
          tipo: { type: 'string' },
          cantidad: { type: 'number' },
          ml: { type: 'number' },
          precioMetro: { type: 'number' },
          subtotal: { type: 'number' },
        },
      },
      VidrioPiezaDespiece: {
        type: 'object',
        description: 'Vidrio agregado del despiece por piezas.',
        properties: {
          descripcion: { type: 'string' },
          espesorMm: { type: 'number' },
          anchoCm: { type: 'number' },
          altoCm: { type: 'number' },
          cantidad: { type: 'number' },
          m2: { type: 'number' },
        },
      },
      DespiecePiezas: {
        type: 'object',
        description: 'Despiece de las piezas dibujadas en un plano.',
        properties: {
          lineas: { type: 'array', items: { $ref: '#/components/schemas/LineaPiezaDespiece' } },
          vidrios: { type: 'array', items: { $ref: '#/components/schemas/VidrioPiezaDespiece' } },
          totalMl: { type: 'number' },
          totalVidrioM2: { type: 'number' },
          totalHerrajes: { type: 'number' },
        },
      },
    },
    responses: {
      NoAutorizado: {
        description: 'Falta el token de acceso o es inválido/expirado.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RespuestaApi' },
            example: { exito: false, datos: null, mensaje: 'Acceso no autorizado: PIN no válido o sesión expirada.' },
          },
        },
      },
      PeticionInvalida: {
        description: 'Parámetros de la petición no válidos.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RespuestaApi' },
            example: { exito: false, datos: null, mensaje: 'Parámetros no válidos.' },
          },
        },
      },
      NoEncontrado: {
        description: 'El recurso solicitado no existe.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RespuestaApi' },
            example: { exito: false, datos: null, mensaje: 'Proyecto no encontrado.' },
          },
        },
      },
      ErrorServidor: {
        description: 'Error interno del servidor.',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RespuestaApi' },
            example: { exito: false, datos: null, mensaje: 'Error interno del servidor.' },
          },
        },
      },
    },
  },
  security: [{ acceso: [] }],
} as const;

export type EspecificacionApi = typeof especificacionApi;
