import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate } from 'react-router-dom';
import { elementoEnPantallaCompleta } from '../../utils/pantallaCompleta';
import IconoCaracteristica from '../comunes/IconoCaracteristica';
import {
  avisarTutorial,
  OPCIONES_TUTORIAL,
  type GrupoTutorial,
  type LadoTarjeta,
  type PasoTutorial,
} from './pasosTutorial';

interface TutorialBienvenidaProps {
  abierto: boolean;
  /** Pasos del recorrido activo (tutorial completo o uno parcial). */
  pasos: PasoTutorial[];
  /** Inicia otro recorrido desde las opciones de la tarjeta final. */
  onElegirGrupo: (grupo: GrupoTutorial) => void;
  onCerrar: () => void;
}

interface Rectangulo {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

interface Tamano {
  ancho: number;
  alto: number;
}

interface Colocacion {
  x: number;
  y: number;
  lado: LadoTarjeta;
}

/** Separación entre la tarjeta y el borde de la pantalla. */
const MARGEN = 14;
/** Separación entre la tarjeta y el elemento resaltado. */
const SEPARACION = 14;
/** Holgura del foco alrededor del elemento resaltado. */
const HOLGURA_FOCO = 8;

function limitar(valor: number, minimo: number, maximo: number): number {
  return Math.min(Math.max(valor, minimo), maximo);
}

function textoDe(valor: string | (() => string) | undefined): string {
  if (!valor) {
    return '';
  }
  return typeof valor === 'function' ? valor() : valor;
}

/**
 * Convierte los tramos escritos entre «guiones angulares» en texto resaltado,
 * para que no se vean los signos en la tarjeta.
 */
function resaltar(texto: string, clave: string): ReactNode[] {
  return texto.split(/«([^»]+)»/g).map((parte, posicion) =>
    posicion % 2 === 1 ? (
      <strong key={`${clave}-${posicion}`} className="tour-resalte">
        {parte}
      </strong>
    ) : (
      parte
    ),
  );
}

/** Ancho de la tarjeta según la cantidad de contenido del paso. */
function anchoTarjeta(paso: PasoTutorial): number {
  if (paso.mostrarOpciones) {
    return 470;
  }
  const contenido = [
    textoDe(paso.titulo),
    textoDe(paso.texto),
    ...(paso.claves ?? []),
    textoDe(paso.nota),
  ]
    .join(' ')
    .length;
  if (contenido < 150) {
    return 300;
  }
  if (contenido < 280) {
    return 350;
  }
  if (contenido < 470) {
    return 410;
  }
  return 470;
}

function coincideRuta(ruta: string | RegExp | undefined, pathname: string): boolean {
  if (!ruta) {
    return true;
  }
  return typeof ruta === 'string' ? ruta === pathname : ruta.test(pathname);
}

function mismoRect(a: Rectangulo, b: Rectangulo): boolean {
  return (
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
}

function leerRect(elemento: Element): Rectangulo {
  const rect = elemento.getBoundingClientRect();
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    right: rect.right,
    bottom: rect.bottom,
  };
}

/** Coloca la tarjeta junto al elemento resaltado, o centrada si no hay objetivo. */
function colocarTarjeta(
  rect: Rectangulo | null,
  tarjeta: Tamano,
  preferida: LadoTarjeta = 'auto',
): Colocacion {
  const anchoVentana = window.innerWidth;
  const altoVentana = window.innerHeight;

  if (!rect || rect.width === 0 || rect.height === 0) {
    return {
      x: limitar(
        (anchoVentana - tarjeta.ancho) / 2,
        MARGEN,
        Math.max(MARGEN, anchoVentana - tarjeta.ancho - MARGEN),
      ),
      y: limitar(
        (altoVentana - tarjeta.alto) / 2,
        MARGEN,
        Math.max(MARGEN, altoVentana - tarjeta.alto - MARGEN),
      ),
      lado: 'auto',
    };
  }

  const opciones: Record<'arriba' | 'abajo' | 'izquierda' | 'derecha', { x: number; y: number }> = {
    abajo: { x: rect.left + rect.width / 2 - tarjeta.ancho / 2, y: rect.bottom + SEPARACION },
    arriba: { x: rect.left + rect.width / 2 - tarjeta.ancho / 2, y: rect.top - SEPARACION - tarjeta.alto },
    derecha: { x: rect.right + SEPARACION, y: rect.top + rect.height / 2 - tarjeta.alto / 2 },
    izquierda: { x: rect.left - SEPARACION - tarjeta.ancho, y: rect.top + rect.height / 2 - tarjeta.alto / 2 },
  };
  const lados: ('abajo' | 'arriba' | 'derecha' | 'izquierda')[] = [
    'abajo',
    'arriba',
    'derecha',
    'izquierda',
  ];
  const orden =
    preferida === 'auto' ? lados : [preferida, ...lados.filter((lado) => lado !== preferida)];

  for (const lado of orden) {
    const opcion = opciones[lado];
    if (
      opcion.x >= MARGEN &&
      opcion.x + tarjeta.ancho <= anchoVentana - MARGEN &&
      opcion.y >= MARGEN &&
      opcion.y + tarjeta.alto <= altoVentana - MARGEN
    ) {
      return { ...opcion, lado };
    }
  }

  // Ningún lado tiene hueco: se usa el de más espacio y se recorta a la pantalla.
  const espacios = {
    abajo: altoVentana - rect.bottom,
    arriba: rect.top,
    derecha: anchoVentana - rect.right,
    izquierda: rect.left,
  };
  const mejor = (Object.keys(espacios) as ('abajo' | 'arriba' | 'derecha' | 'izquierda')[]).reduce(
    (a, b) => (espacios[a] >= espacios[b] ? a : b),
  );
  const base = opciones[mejor];
  return {
    x: limitar(base.x, MARGEN, Math.max(MARGEN, anchoVentana - tarjeta.ancho - MARGEN)),
    y: limitar(base.y, MARGEN, Math.max(MARGEN, altoVentana - tarjeta.alto - MARGEN)),
    lado: mejor,
  };
}

/**
 * Tutorial guiado: cada paso resalta un elemento de la interfaz con una
 * tarjeta de tamaño adaptativo, navega entre páginas cuando hace falta y
 * avanza cuando el usuario pulsa lo que se le indica.
 */
export default function TutorialBienvenida({
  abierto,
  pasos,
  onElegirGrupo,
  onCerrar,
}: TutorialBienvenidaProps): JSX.Element | null {
  const navegar = useNavigate();
  const { pathname } = useLocation();
  const [indice, setIndice] = useState(0);
  const [rect, setRect] = useState<Rectangulo | null>(null);
  const [colocacion, setColocacion] = useState<Colocacion | null>(null);

  const tarjetaRef = useRef<HTMLDivElement>(null);
  const objetivoRef = useRef<Element | null>(null);
  const rutaAnteriorRef = useRef(pathname);
  const indiceAnteriorRef = useRef(indice);
  const enfoqueRef = useRef(-1);
  const temporizadorRef = useRef<number | null>(null);
  /** Elemento a pantalla completa donde se monta la tarjeta (si lo hay). */
  const [destinoPortal, setDestinoPortal] = useState<Element | null>(null);

  // Con el editor a pantalla completa solo se ve ese elemento: la tarjeta se
  // monta dentro para poder seguir explicando el plano en móvil.
  useEffect(() => {
    function actualizarDestino(): void {
      setDestinoPortal(elementoEnPantallaCompleta());
    }
    document.addEventListener('fullscreenchange', actualizarDestino);
    document.addEventListener('webkitfullscreenchange', actualizarDestino);
    actualizarDestino();
    return () => {
      document.removeEventListener('fullscreenchange', actualizarDestino);
      document.removeEventListener('webkitfullscreenchange', actualizarDestino);
    };
  }, []);

  const total = pasos.length;
  // El índice se recorta por si el recorrido cambia de longitud (orientación).
  const indiceMostrado = Math.min(indice, total - 1);
  const paso = pasos[indiceMostrado];
  const esUltimo = indiceMostrado === total - 1;
  const enRuta = coincideRuta(paso.ruta, pathname);
  // Los pasos que exigen pulsar algo (pestañas, crear, editar) no se pueden
  // saltar con «Siguiente»: avanzan solos cuando el usuario hace la acción.
  const requiereAccion = Boolean(paso.esperarEntrada || paso.avanzarAlPulsar || paso.avanzarCuando);
  const esperandoNavegacion = Boolean(
    paso.esperarEntrada && !enRuta && typeof paso.ruta === 'string',
  );
  const hayPrimario = esUltimo || esperandoNavegacion || !requiereAccion;
  const pista = hayPrimario
    ? ''
    : (paso.pistaAccion ?? 'Realiza la acción resaltada para continuar.');

  const avanzarDesde = useCallback(
    (desde: number): void => {
      setIndice((actual) => {
        const base = Math.min(actual, pasos.length - 1);
        return base === desde ? Math.min(base + 1, pasos.length - 1) : actual;
      });
    },
    [pasos],
  );

  const programarAvance = useCallback(
    (desde: number, retraso = 300): void => {
      if (temporizadorRef.current !== null) {
        window.clearTimeout(temporizadorRef.current);
      }
      temporizadorRef.current = window.setTimeout(() => {
        temporizadorRef.current = null;
        avanzarDesde(desde);
      }, retraso);
    },
    [avanzarDesde],
  );

  // Cada apertura vuelve a empezar por el primer paso.
  useEffect(() => {
    if (abierto) {
      setIndice(0);
    }
  }, [abierto, pasos]);

  // Al cambiar de paso se descarta cualquier avance que estuviera en camino.
  useEffect(() => {
    if (temporizadorRef.current !== null) {
      window.clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
  }, [indice]);

  // Si el recorrido cambia de longitud (orientación), el índice se ajusta.
  useEffect(() => {
    if (indice > pasos.length - 1) {
      setIndice(pasos.length - 1);
    }
  }, [indice, pasos]);

  // Los pasos de página navegan solos; los de pestaña esperan a que el usuario entre.
  useEffect(() => {
    const cambio = indiceAnteriorRef.current !== indice;
    indiceAnteriorRef.current = indice;
    if (!abierto || !cambio) {
      return;
    }
    const actual = pasos[indiceMostrado];
    if (
      typeof actual.ruta === 'string' &&
      !actual.esperarEntrada &&
      actual.ruta !== pathname
    ) {
      navegar(actual.ruta);
    }
  }, [abierto, indice, pathname, navegar, pasos]);

  // Si el paso espera una ruta, al llegar a ella se avanza solo.
  useEffect(() => {
    const anterior = rutaAnteriorRef.current;
    rutaAnteriorRef.current = pathname;
    if (!abierto || anterior === pathname) {
      return;
    }
    const actual = pasos[indiceMostrado];
    if (actual.esperarEntrada && coincideRuta(actual.ruta, pathname)) {
      programarAvance(indiceMostrado, 350);
    }
  }, [pathname, abierto, indice, programarAvance, pasos]);

  // Algunos pasos avanzan cuando aparece su siguiente pantalla (por ejemplo,
  // el editor después de crear el proyecto). Solo cuenta la aparición: si la
  // pantalla ya estaba (al retroceder), el paso se queda esperando.
  useEffect(() => {
    if (!abierto) {
      return;
    }
    const selector = pasos[indiceMostrado].avanzarCuando;
    if (!selector) {
      return;
    }
    let presente = document.querySelector(selector) !== null;
    let vigente = true;
    const observador = new MutationObserver(() => {
      if (!vigente) {
        return;
      }
      const ahora = document.querySelector(selector) !== null;
      if (!presente && ahora) {
        vigente = false;
        observador.disconnect();
        programarAvance(indiceMostrado, 500);
      }
      presente = ahora;
    });
    observador.observe(document.body, { childList: true, subtree: true });
    return () => {
      vigente = false;
      observador.disconnect();
    };
  }, [abierto, indice, programarAvance, pasos]);

  // Los pasos de pestaña avanzan también al pulsar el elemento resaltado.
  // En móvil, abrir el menú (la hamburguesa) no avanza: solo lo hace el enlace.
  useEffect(() => {
    if (!abierto || !pasos[indiceMostrado].avanzarAlPulsar) {
      return;
    }
    const objetivo = objetivoRef.current;
    if (!objetivo || objetivo.getAttribute('data-tour') === 'nav-menu') {
      return;
    }
    const alPulsar = (): void => programarAvance(indiceMostrado, 300);
    objetivo.addEventListener('click', alPulsar);
    return () => objetivo.removeEventListener('click', alPulsar);
  }, [abierto, indice, rect, programarAvance, pasos]);

  // En móvil, los pasos de pestaña abren el menú para resaltar el enlace
  // (en escritorio los enlaces están a la vista y no hace falta).
  useEffect(() => {
    if (!abierto || !pasos[indiceMostrado].abrirMenu) {
      return;
    }
    const hayEnlacesEscritorio = document.querySelector('[data-tour="nav-proyectos"]') !== null;
    if (!hayEnlacesEscritorio) {
      avisarTutorial('abrir-menu');
    }
    return () => avisarTutorial('cerrar-menu');
  }, [abierto, indice, pasos]);

  // El paso puede pedirle algo a la página (prellenar el formulario, abrir el panel...).
  useEffect(() => {
    if (!abierto) {
      return;
    }
    const actual = pasos[indiceMostrado];
    const evento = actual.evento;
    if (!evento || !coincideRuta(actual.ruta, pathname)) {
      return;
    }
    const temporizador = window.setTimeout(() => avisarTutorial(evento.accion, evento.nombre), 150);
    return () => window.clearTimeout(temporizador);
  }, [abierto, indice, pathname, pasos]);

  // Mide el elemento resaltado y lo mantiene al día mientras cambia la página.
  const medir = useCallback((): void => {
    const actual: PasoTutorial = pasos[indiceMostrado];
    const selector =
      typeof actual.objetivo === 'function' ? actual.objetivo() : actual.objetivo;
    const elemento = selector ? document.querySelector(selector) : null;
    objetivoRef.current = elemento;
    if (!elemento) {
      setRect((antes) => (antes === null ? antes : null));
      return;
    }
    const siguiente = leerRect(elemento);
    if (siguiente.width === 0 && siguiente.height === 0) {
      setRect((antes) => (antes === null ? antes : null));
      return;
    }
    setRect((antes) => (antes && mismoRect(antes, siguiente) ? antes : siguiente));

    if (enfoqueRef.current !== indiceMostrado) {
      enfoqueRef.current = indiceMostrado;
      const visible =
        siguiente.top >= 8 &&
        siguiente.bottom <= window.innerHeight - 8 &&
        siguiente.left >= 0 &&
        siguiente.right <= window.innerWidth;
      if (!visible) {
        elemento.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      }
    }
  }, [indice, pasos]);

  useEffect(() => {
    if (!abierto) {
      return;
    }
    medir();
    let marco: number | null = null;
    const programarMedicion = (): void => {
      if (marco !== null) {
        return;
      }
      marco = window.requestAnimationFrame(() => {
        marco = null;
        medir();
      });
    };
    const observador = new MutationObserver(programarMedicion);
    observador.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    window.addEventListener('resize', programarMedicion);
    window.addEventListener('scroll', programarMedicion, true);
    return () => {
      observador.disconnect();
      window.removeEventListener('resize', programarMedicion);
      window.removeEventListener('scroll', programarMedicion, true);
      if (marco !== null) {
        window.cancelAnimationFrame(marco);
      }
    };
  }, [abierto, indice, medir]);

  // Coloca la tarjeta junto al objetivo (o en el centro) antes de pintarla.
  useLayoutEffect(() => {
    if (!abierto) {
      return;
    }
    const tarjeta = tarjetaRef.current;
    if (!tarjeta) {
      return;
    }
    const tamano = { ancho: tarjeta.offsetWidth, alto: tarjeta.offsetHeight };
    const siguiente = colocarTarjeta(rect, tamano, pasos[indiceMostrado].posicion ?? 'auto');
    setColocacion((antes) =>
      antes && antes.x === siguiente.x && antes.y === siguiente.y && antes.lado === siguiente.lado
        ? antes
        : siguiente,
    );
  }, [abierto, indice, rect, pasos]);

  useEffect(() => {
    if (!abierto) {
      return;
    }
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') {
        onCerrar();
      } else if (evento.key === 'ArrowRight') {
        const actual = pasos[indiceMostrado];
        const exigeAccion = Boolean(
          actual.esperarEntrada || actual.avanzarAlPulsar || actual.avanzarCuando,
        );
        if (!exigeAccion) {
          avanzarDesde(indiceMostrado);
        }
      } else if (evento.key === 'ArrowLeft') {
        setIndice((actual) => Math.max(actual - 1, 0));
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [abierto, indice, onCerrar, avanzarDesde, pasos]);

  if (!abierto) {
    return null;
  }

  function accionPrincipal(): void {
    if (paso.esperarEntrada && !enRuta && typeof paso.ruta === 'string') {
      navegar(paso.ruta);
      return;
    }
    if (esUltimo) {
      onCerrar();
      return;
    }
    avanzarDesde(indiceMostrado);
  }

  const textoPrincipal =
    paso.esperarEntrada && !enRuta
      ? (paso.textoEspera ?? 'Continuar')
      : esUltimo
        ? 'Cerrar'
        : 'Siguiente';
  const porcentaje = ((indiceMostrado + 1) / total) * 100;
  const titulo = textoDe(paso.titulo);
  const texto = textoDe(paso.texto);
  const nota = textoDe(paso.nota);
  const botonAccion = paso.botonAccion;
  const estiloTarjeta = {
    '--ancho-tour': `${anchoTarjeta(paso)}px`,
    ...(colocacion ? { left: `${colocacion.x}px`, top: `${colocacion.y}px` } : {}),
  } as CSSProperties;

  const tarjeta = (
    <div className="tour" role="dialog" aria-label="Tutorial de GlassView">
      {rect ? (
        <div
          className="tour-foco"
          aria-hidden="true"
          style={{
            left: `${rect.left - HOLGURA_FOCO}px`,
            top: `${rect.top - HOLGURA_FOCO}px`,
            width: `${rect.width + HOLGURA_FOCO * 2}px`,
            height: `${rect.height + HOLGURA_FOCO * 2}px`,
          }}
        />
      ) : (
        <div className="tour-velo" aria-hidden="true" />
      )}

      <div
        ref={tarjetaRef}
        className={`tour-tarjeta ${colocacion ? 'tour-visible' : ''} ${
          paso.mostrarOpciones ? 'tour-tarjeta-opciones' : ''
        }`}
        style={estiloTarjeta}
      >
        <header className="tour-cabecera">
          <span className="tour-icono">
            {paso.icono === 'logo' ? (
              <img src="/icono.png" alt="" />
            ) : (
              <IconoCaracteristica nombre={paso.icono} />
            )}
          </span>
          <span className="tour-seccion">{paso.seccion}</span>
          <button
            type="button"
            className="tour-cerrar"
            aria-label="Cerrar tutorial"
            title="Cerrar"
            onClick={onCerrar}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6.5 6.5 17.5 17.5M17.5 6.5 6.5 17.5" />
            </svg>
          </button>
        </header>

        <div className="tour-cuerpo" aria-live="polite">
          <div className="tour-contenido" key={indiceMostrado}>
            <h2 className="tour-titulo">{resaltar(titulo, 'titulo')}</h2>
            <p className="tour-texto">{resaltar(texto, 'texto')}</p>

            {paso.claves && (
              <ul className="tour-claves">
                {paso.claves.map((clave, posicion) => (
                  <li key={clave}>{resaltar(clave, `clave-${posicion}`)}</li>
                ))}
              </ul>
            )}

            {nota && <p className="tour-nota">{resaltar(nota, 'nota')}</p>}

            {botonAccion && (
              <button
                type="button"
                className="tour-boton-accion"
                onClick={() => {
                  avisarTutorial(botonAccion.accion);
                  // La pantalla completa oculta la tarjeta: el recorrido queda
                  // listo en el siguiente paso para cuando se vuelva de ella.
                  programarAvance(indiceMostrado, 600);
                }}
              >
                {botonAccion.texto}
              </button>
            )}

            {paso.mostrarOpciones && (
              <div className="tour-opciones">
                <p className="tour-opciones-titulo">Repasa otro recorrido</p>
                <ul className="tour-opciones-lista">
                  {OPCIONES_TUTORIAL.map((opcion) => (
                    <li key={opcion.grupo}>
                      <button
                        type="button"
                        className="tour-opcion"
                        onClick={() => onElegirGrupo(opcion.grupo)}
                      >
                        <span className="tour-opcion-icono">
                          {opcion.icono === 'logo' ? (
                            <img src="/icono.png" alt="" />
                          ) : (
                            <IconoCaracteristica nombre={opcion.icono} />
                          )}
                        </span>
                        <span className="tour-opcion-datos">
                          <strong>{opcion.titulo}</strong>
                          <span>{opcion.texto}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <footer className="tour-pie">
          {!esUltimo ? (
            <button type="button" className="tour-saltar" onClick={onCerrar}>
              Saltar tutorial
            </button>
          ) : (
            <span className="tour-saltar tour-saltar-vacio" aria-hidden="true" />
          )}

          <div className="tour-acciones">
            {indiceMostrado > 0 && (
              <button
                type="button"
                className="boton-secundario tour-anterior"
                onClick={() => setIndice((actual) => Math.max(actual - 1, 0))}
              >
                Anterior
              </button>
            )}
            {hayPrimario && (
              <button type="button" className="boton-primario" onClick={accionPrincipal} autoFocus>
                {textoPrincipal}
              </button>
            )}
          </div>

          {!hayPrimario && (
            <p className="tour-espera" role="status">
              <span className="tour-espera-punto" aria-hidden="true" />
              {resaltar(pista, 'pista')}
            </p>
          )}

          <div className="tour-paso">
            <span className="tour-paso-texto">
              Paso {indiceMostrado + 1} de {total}
            </span>
            <div
              className="tour-progreso"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={total}
              aria-valuenow={indiceMostrado + 1}
              aria-label={`Paso ${indiceMostrado + 1} de ${total}`}
            >
              <span className="tour-progreso-relleno" style={{ width: `${porcentaje}%` }} />
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  return destinoPortal ? createPortal(tarjeta, destinoPortal) : tarjeta;
}
