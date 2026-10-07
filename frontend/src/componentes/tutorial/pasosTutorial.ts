import type { NombreIcono } from '../comunes/IconoCaracteristica';

/** Evento con el que el tutorial pide cambios a la página que está abierta. */
export const EVENTO_TUTORIAL = 'glassview:tutorial';

export interface EventoTutorial {
  /** Acción que debe atender la página (prellenar, abrir un panel...). */
  accion: string;
  /** Dato opcional de la acción. */
  nombre?: string;
}

/** Avisa a la página de que el tutorial necesita algo (prellenar, abrir el panel...). */
export function avisarTutorial(accion: string, nombre?: string): void {
  window.dispatchEvent(
    new CustomEvent<EventoTutorial>(EVENTO_TUTORIAL, { detail: { accion, nombre } }),
  );
}

export type LadoTarjeta = 'auto' | 'arriba' | 'abajo' | 'izquierda' | 'derecha';

/** Recorridos disponibles desde el icono de información del pie de página. */
export type GrupoTutorial = 'completo' | 'proyectos' | 'nuevo-proyecto' | 'plano' | 'piezas';

/** Opción de recorrido que se muestra en el selector y en la tarjeta final. */
export interface OpcionTutorial {
  grupo: GrupoTutorial;
  icono: NombreIcono | 'logo';
  titulo: string;
  texto: string;
}

export const OPCIONES_TUTORIAL: OpcionTutorial[] = [
  {
    grupo: 'proyectos',
    icono: 'proyectos',
    titulo: 'Proyectos',
    texto: 'La pestaña y la página de proyectos, con la tarjeta del proyecto más reciente.',
  },
  {
    grupo: 'nuevo-proyecto',
    icono: 'plantilla',
    titulo: 'Nuevo proyecto',
    texto: 'Las medidas del hueco, las plantillas y la creación de un plano.',
  },
  {
    grupo: 'plano',
    icono: 'plano',
    titulo: 'Plano',
    texto: 'El lienzo, las herramientas de dibujo y el despiece del proyecto más reciente.',
  },
  {
    grupo: 'piezas',
    icono: 'catalogo',
    titulo: 'Piezas',
    texto: 'La biblioteca de piezas personalizadas y su editor de formas.',
  },
  {
    grupo: 'completo',
    icono: 'logo',
    titulo: 'Tutorial completo',
    texto: 'El recorrido de principio a fin: proyectos, plano y piezas.',
  },
];

export interface PasoTutorial {
  /** Rótulo de la sección que se está explicando. */
  seccion: string;
  /** Icono del paso; «logo» usa el icono de la aplicación. */
  icono: NombreIcono | 'logo';
  /** Título del paso; admite una función para adaptarse a lo que haya en la página. */
  titulo: string | (() => string);
  /** Texto del paso; admite una función para adaptarse a lo que haya en la página. */
  texto: string | (() => string);
  claves?: string[];
  /** Nota resaltada al final del paso. */
  nota?: string | (() => string);
  /** Ruta en la que vive el contenido del paso. Sin ruta, el paso es global. */
  ruta?: string | RegExp;
  /** Elemento que se resalta (selector CSS o función que lo resuelve). */
  objetivo?: string | (() => string | null);
  /** Lado preferido de la tarjeta respecto al elemento resaltado. */
  posicion?: LadoTarjeta;
  /** El paso espera a que el usuario entre en `ruta` (por ejemplo, pulsar una pestaña). */
  esperarEntrada?: boolean;
  /** Texto del botón principal mientras el usuario no está en `ruta`. */
  textoEspera?: string;
  /** Pista que se muestra en el pie mientras el paso espera una acción del usuario. */
  pistaAccion?: string;
  /** Avanza solo cuando este selector aparece en la página. */
  avanzarCuando?: string;
  /** Avanza cuando el usuario pulsa el elemento resaltado. */
  avanzarAlPulsar?: boolean;
  /** Acción que se envía a la página al mostrar el paso. */
  evento?: EventoTutorial;
  /** Muestra la lista de recorridos disponibles al final de la tarjeta. */
  mostrarOpciones?: boolean;
  /** En móvil, abre el menú de la barra para poder resaltar el enlace de la pestaña. */
  abrirMenu?: boolean;
  /** Botón dentro de la tarjeta que ejecuta una acción en la página abierta. */
  botonAccion?: { texto: string; accion: string };
}

/** Ruta del editor de un proyecto guardado. */
const RUTA_EDITOR = /^\/proyectos\/[^/]+$/;

/** Pestañas de la barra de navegación, también presentes en el menú móvil. */
function objetivoNavegacion(tab: 'proyectos' | 'nuevo' | 'piezas'): () => string | null {
  return () => {
    const candidatos = [
      `[data-tour="menu-${tab}"]`,
      `[data-tour="nav-${tab}"]`,
      '[data-tour="nav-menu"]',
    ];
    for (const selector of candidatos) {
      if (document.querySelector(selector)) {
        return selector;
      }
    }
    return null;
  };
}

/** La primera tarjeta de proyecto, o el aviso de que todavía no hay ninguno. */
function objetivoProyectos(): string | null {
  if (document.querySelector('[data-tour="proyectos-tarjeta"]')) {
    return '[data-tour="proyectos-tarjeta"]';
  }
  return document.querySelector('[data-tour="proyectos-vacio"]')
    ? '[data-tour="proyectos-vacio"]'
    : null;
}

/** Indica si la cuenta ya tiene al menos un proyecto en la página. */
function hayProyectos(): boolean {
  return document.querySelector('[data-tour="proyectos-tarjeta"]') !== null;
}

/** El editor de formas incrustado, o su botón de apertura en pantallas pequeñas. */
function objetivoEditorPiezas(): string {
  return document.querySelector('[data-tour="piezas-formas"]')
    ? '[data-tour="piezas-formas"]'
    : '[data-tour="piezas-editor-acceso"]';
}

/** Tarjeta final común a todos los recorridos. */
function cierre(texto: string): PasoTutorial {
  return {
    seccion: 'Fin',
    icono: 'logo',
    titulo: 'Recorrido completado',
    texto,
    mostrarOpciones: true,
  };
}

const PROYECTOS_TAB: PasoTutorial = {
  seccion: 'Proyectos',
  icono: 'proyectos',
  titulo: 'Pestaña Proyectos',
  texto:
    'La pestaña «Proyectos» reúne los planos de la cuenta. Cada ventana se guarda como un proyecto privado.',
  claves: [
    'Los planos se dibujan a escala real, en centímetros.',
    'Del plano se obtienen los perfiles, el vidrio y los herrajes.',
    'Los proyectos solo son visibles para su propietario.',
  ],
  pistaAccion: 'Pulsa la pestaña «Proyectos» para continuar.',
  ruta: '/proyectos',
  objetivo: objetivoNavegacion('proyectos'),
  posicion: 'abajo',
  esperarEntrada: true,
  textoEspera: 'Ir a Proyectos',
  avanzarAlPulsar: true,
  abrirMenu: true,
};

const PROYECTOS_PAGINA: PasoTutorial = {
  seccion: 'Proyectos',
  icono: 'proyectos',
  titulo: 'Página de proyectos',
  texto:
    'El encabezado indica cuántos proyectos hay. Debajo, cada plano se presenta en una tarjeta.',
  claves: [
    'La miniatura reproduce el plano dibujado.',
    'Abrir una tarjeta carga el plano en el editor.',
  ],
  ruta: '/proyectos',
  objetivo: '[data-tour="proyectos-titulo"]',
  posicion: 'abajo',
};

const PROYECTOS_TARJETA: PasoTutorial = {
  seccion: 'Proyectos',
  icono: 'proyectos',
  titulo: () => (hayProyectos() ? 'Tarjeta de proyecto' : 'Sin proyectos todavía'),
  texto: () =>
    hayProyectos()
      ? 'La tarjeta resume el proyecto: miniatura, cliente y chips con el recuento de piezas, perfiles, vidrios, metros lineales y m² de vidrio.'
      : 'En este espacio aparecerán las tarjetas de los proyectos con su miniatura y su resumen de material.',
  claves: [
    '«Nuevo proyecto» abre el asistente de creación.',
    '«Eliminar» borra el proyecto y sus piezas.',
  ],
  nota: () =>
    hayProyectos()
      ? 'La tarjeta más reciente aparece destacada.'
      : 'El aviso indica cómo crear el primer proyecto.',
  ruta: '/proyectos',
  objetivo: objetivoProyectos,
  posicion: 'auto',
};

const NUEVO_TAB: PasoTutorial = {
  seccion: 'Nuevo proyecto',
  icono: 'plantilla',
  titulo: 'Pestaña Nuevo proyecto',
  texto:
    'La pestaña «Nuevo proyecto» abre el asistente para definir las medidas del hueco y, de forma opcional, partir de una plantilla de ventanería.',
  pistaAccion: 'Pulsa la pestaña «Nuevo proyecto» para continuar.',
  ruta: '/nuevo-proyecto',
  objetivo: objetivoNavegacion('nuevo'),
  posicion: 'abajo',
  esperarEntrada: true,
  textoEspera: 'Ir a Nuevo proyecto',
  avanzarAlPulsar: true,
  abrirMenu: true,
  evento: { accion: 'preparar-nuevo-proyecto' },
};

const NUEVO_DATOS: PasoTutorial = {
  seccion: 'Nuevo proyecto',
  icono: 'plantilla',
  titulo: 'Datos del proyecto',
  texto:
    'El nombre identifica la obra y es obligatorio; el cliente es opcional. El recorrido deja un nombre de ejemplo ya escrito.',
  claves: [
    'El proyecto se guarda en la cuenta al confirmar la creación.',
    'El nombre puede modificarse después.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="nuevo-datos"]',
  posicion: 'izquierda',
  evento: { accion: 'prellenar-proyecto' },
};

const NUEVO_LIENZO: PasoTutorial = {
  seccion: 'Nuevo proyecto',
  icono: 'regla',
  titulo: 'Lienzo y plantilla',
  texto:
    '«Hueco de obra» limita el dibujo a las medidas reales; «Mapa libre» permite dibujar sin límites. La plantilla coloca el marco, las hojas y los vidrios de un modelo del catálogo.',
  claves: [
    'El recorrido selecciona una plantilla de ejemplo.',
    'La plantilla puede cambiarse o retirarse para dibujar a mano.',
  ],
  nota: 'Con plantilla, el editor se abre con una ventana completa.',
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="nuevo-lienzo"]',
  posicion: 'izquierda',
  evento: { accion: 'elegir-plantilla' },
};

const NUEVO_PREVIEW: PasoTutorial = {
  seccion: 'Nuevo proyecto',
  icono: 'plano',
  titulo: 'Vista previa',
  texto:
    'La vista previa refleja las medidas y la plantilla seleccionadas antes de crear el proyecto.',
  claves: [
    'Las medidas y la plantilla se ajustan en cualquier momento.',
    'Al crear, el dibujo se abre listo para editar.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="nuevo-preview"]',
  posicion: 'derecha',
};

const NUEVO_CREAR: PasoTutorial = {
  seccion: 'Nuevo proyecto',
  icono: 'plano',
  titulo: 'Crear y dibujar',
  texto:
    '«Crear y dibujar plano» guarda el proyecto y abre el editor con las piezas de la plantilla ya colocadas.',
  nota: 'La siguiente pantalla es el editor del plano.',
  pistaAccion: 'Pulsa «Crear y dibujar plano» para continuar.',
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="nuevo-crear"]',
  posicion: 'arriba',
  avanzarCuando: '[data-tour="editor-lienzo"]',
};

const EDITOR_LIENZO: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'plano',
  titulo: 'Lienzo a escala real',
  texto:
    'El plano se dibuja en centímetros sobre una rejilla. El hueco de obra delimita la zona de dibujo; en mapa libre no hay límites.',
  claves: [
    'La rueda o el pellizco acercan y alejan; el arrastre desplaza la vista.',
    'Seleccionar una pieza muestra sus cotas y medidas.',
    'Ctrl+Z deshace la última edición.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="editor-lienzo"]',
  posicion: 'auto',
};

const EDITOR_HERRAMIENTAS: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'catalogo',
  titulo: 'Barra de herramientas',
  texto: 'La barra lateral construye la ventana pieza a pieza.',
  claves: [
    '«Plantillas» inserta una ventana completa de un modelo del catálogo.',
    '«Piezas» inserta piezas personalizadas propias o públicas.',
    'Cada tipo de perfil y de vidrio se dibuja directamente sobre el lienzo.',
    '«Ayuda» resume los atajos del editor.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="editor-herramientas"]',
  posicion: 'derecha',
};

const EDITOR_ACCIONES: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'pdf',
  titulo: 'Acciones del proyecto',
  texto: 'El encabezado agrupa las operaciones principales del editor.',
  claves: [
    'Deshacer revierte la última edición (Ctrl+Z).',
    '«Piezas y despiece» abre el panel lateral de material.',
    'La descarga genera el PDF A4 del plano.',
    'El ojo vuelve al modo de solo lectura.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="editor-acciones"]',
  posicion: 'abajo',
};

const EDITOR_PANEL: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'despiece',
  titulo: 'Panel de piezas',
  texto:
    'El panel lateral resume los elementos del plano. La pestaña «Piezas» permite seleccionar o eliminar cada perfil, vidrio y herraje.',
  claves: [
    'La lista se actualiza con cada cambio del plano.',
    '«Guardar» sincroniza los cambios con el servidor.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="editor-panel"]',
  posicion: 'izquierda',
  evento: { accion: 'abrir-panel' },
};

const EDITOR_DESPIECE: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'despiece',
  titulo: 'Despiece para el taller',
  texto:
    'La pestaña «Despiece» convierte el plano en la lista de corte: perfiles por REF con metros lineales, vidrios con área y recuento de herrajes y empaques.',
  claves: [
    'Los cortes se agrupan por REF, igual que en el taller.',
    'El PDF descargado incluye el despiece completo.',
  ],
  ruta: '/nuevo-proyecto',
  objetivo: '[data-tour="editor-panel-cuerpo"]',
  posicion: 'izquierda',
  evento: { accion: 'ver-despiece' },
};

const PIEZAS_TAB: PasoTutorial = {
  seccion: 'Piezas',
  icono: 'catalogo',
  titulo: 'Pestaña Piezas',
  texto:
    'La pestaña «Piezas» contiene la biblioteca de piezas personalizadas. Cada pieza se dibuja una vez y se reutiliza en cualquier plano.',
  pistaAccion: 'Pulsa la pestaña «Piezas» para continuar.',
  ruta: '/piezas',
  objetivo: objetivoNavegacion('piezas'),
  posicion: 'abajo',
  esperarEntrada: true,
  textoEspera: 'Ir a Piezas',
  avanzarAlPulsar: true,
  abrirMenu: true,
};

const PIEZAS_CAMPOS: PasoTutorial = {
  seccion: 'Piezas',
  icono: 'regla',
  titulo: 'Identificación de la pieza',
  texto:
    'Nombre, REF y tipo (perfil, vidrio, acrílico o herraje) identifican la pieza. El tipo determina los campos disponibles: uso en perfiles y herrajes, espesor en vidrios y acrílicos.',
  claves: [
    'La REF aparece después en el despiece.',
    'El material define el color en el plano y en las miniaturas.',
  ],
  ruta: '/piezas',
  objetivo: '[data-tour="piezas-campos"]',
  posicion: 'abajo',
};

const PIEZAS_FORMAS: PasoTutorial = {
  seccion: 'Piezas',
  icono: 'regla',
  titulo: 'Editor de formas',
  texto:
    'El contorno se traza sobre una rejilla y se organiza por capas; cada trazo admite su propio material.',
  claves: [
    'Los vértices se arrastran para ajustar la figura.',
    'En móvil el editor se abre a pantalla completa y se usa en horizontal.',
    '«Guardar pieza» la deja disponible para los planos.',
  ],
  nota: '«Piezas de la comunidad» muestra las publicadas por otras cuentas.',
  ruta: '/piezas',
  objetivo: objetivoEditorPiezas,
  posicion: 'auto',
};

const PLANO_ACCIONES: PasoTutorial = {
  seccion: 'Plano',
  icono: 'pdf',
  titulo: 'Acciones del plano',
  texto: 'El encabezado agrupa la descarga y el cambio de modo.',
  claves: [
    'La descarga genera el PDF A4 con el plano y su despiece.',
    'El lápiz abre el modo edición; el ojo vuelve a solo lectura.',
  ],
  ruta: RUTA_EDITOR,
  objetivo: '[data-tour="editor-acciones"]',
  posicion: 'abajo',
};

const PLANO_EDITAR: PasoTutorial = {
  seccion: 'Plano',
  icono: 'plano',
  titulo: 'Modo edición',
  texto:
    'El modo edición habilita la barra de herramientas y los paneles laterales. En solo lectura el plano únicamente se consulta y se descarga.',
  pistaAccion: 'Pulsa «Editar plano» para continuar.',
  ruta: RUTA_EDITOR,
  objetivo: '[data-tour="editor-editar"]',
  posicion: 'abajo',
  avanzarAlPulsar: true,
  avanzarCuando: '[data-tour="editor-herramientas"]',
};

/** Aviso previo al editor en móvil vertical: el dibujo se hace en horizontal. */
const ORIENTACION: PasoTutorial = {
  seccion: 'Editor de planos',
  icono: 'plano',
  titulo: 'Pantalla en horizontal',
  texto:
    'El editor de planos se usa en horizontal: así caben el lienzo completo y las herramientas. Gira el dispositivo o activa la pantalla horizontal para continuar.',
  claves: [
    'El botón pide pantalla completa y bloquea el giro en horizontal.',
    'Al salir de la pantalla completa, la orientación vuelve a ser libre.',
  ],
  botonAccion: { texto: 'Activar pantalla horizontal', accion: 'pantalla-horizontal' },
};

/** Pasos del recorrido completo; en vertical incluye el aviso de orientación. */
function pasosCompletos(vertical: boolean): PasoTutorial[] {
  return [
    PROYECTOS_TAB,
    PROYECTOS_PAGINA,
    PROYECTOS_TARJETA,
    NUEVO_TAB,
    NUEVO_DATOS,
    NUEVO_LIENZO,
    NUEVO_PREVIEW,
    NUEVO_CREAR,
    ...(vertical ? [ORIENTACION] : []),
    EDITOR_LIENZO,
    EDITOR_HERRAMIENTAS,
    EDITOR_ACCIONES,
    EDITOR_PANEL,
    EDITOR_DESPIECE,
    PIEZAS_TAB,
    PIEZAS_CAMPOS,
    PIEZAS_FORMAS,
    cierre(
      'GlassView dibuja la ventana a escala real y de ahí salen los perfiles, el vidrio, los herrajes y el empaque de la obra. El despiece y el PDF se generan desde el mismo plano.',
    ),
  ];
}

/**
 * Pasos que componen cada recorrido disponible desde el icono de información.
 * En móvil vertical se intercala el aviso de pantalla horizontal antes del editor.
 */
export function pasosDelGrupo(grupo: GrupoTutorial, vertical = false): PasoTutorial[] {
  switch (grupo) {
    case 'proyectos':
      return [
        PROYECTOS_TAB,
        PROYECTOS_PAGINA,
        PROYECTOS_TARJETA,
        cierre(
          'Los proyectos agrupan los planos de la cuenta. Cada tarjeta abre su plano en el editor y resume el material calculado.',
        ),
      ];
    case 'nuevo-proyecto':
      return [
        NUEVO_TAB,
        NUEVO_DATOS,
        NUEVO_LIENZO,
        NUEVO_PREVIEW,
        NUEVO_CREAR,
        ...(vertical ? [ORIENTACION] : []),
        cierre(
          'El asistente define las medidas, el tipo de lienzo y la plantilla. Al crear el proyecto, el editor se abre con las piezas ya colocadas.',
        ),
      ];
    case 'plano':
      return [
        ...(vertical ? [ORIENTACION] : []),
        { ...EDITOR_LIENZO, ruta: RUTA_EDITOR },
        PLANO_ACCIONES,
        PLANO_EDITAR,
        { ...EDITOR_HERRAMIENTAS, ruta: RUTA_EDITOR },
        { ...EDITOR_PANEL, ruta: RUTA_EDITOR },
        { ...EDITOR_DESPIECE, ruta: RUTA_EDITOR },
        cierre(
          'El editor trabaja a escala real: lienzo con rejilla, herramientas por tipo de pieza, panel de material y despiece para el taller.',
        ),
      ];
    case 'piezas':
      return [
        PIEZAS_TAB,
        PIEZAS_CAMPOS,
        PIEZAS_FORMAS,
        cierre(
          'Las piezas personalizadas se dibujan una vez con su forma y su material, y quedan disponibles para cualquier plano.',
        ),
      ];
    default:
      return pasosCompletos(vertical);
  }
}
