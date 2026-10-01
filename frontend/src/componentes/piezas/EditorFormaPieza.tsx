import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as EventoRaton,
  type PointerEvent as EventoPuntero,
} from 'react';
import type {
  FormaPieza,
  MaterialPieza,
  PuntoForma,
  TipoPiezaPersonalizada,
  TrazoForma,
} from '../../tipos';
import { obtenerPaletaPiezas } from '../../utils/colores';
import PrimitivasSvg from '../../piezas/PrimitivasSvg';
import { primitivasDeForma } from '../../piezas/formas';
import AyudaForma from './AyudaForma';
import ModalMateriales from './ModalMateriales';

export interface EditorFormaPiezaProps {
  forma: FormaPieza;
  tipo: TipoPiezaPersonalizada;
  /** Identifica la pieza editada: al cambiar, el historial se reinicia. */
  clave: string;
  onCambiar: (forma: FormaPieza) => void;
  /** Materiales disponibles para las capas (predefinidos y propios). */
  materiales?: MaterialPieza[];
  /** Guarda un material propio creado desde el editor. */
  onCrearMaterial?: (material: MaterialPieza) => void;
}

type HerramientaForma =
  | 'seleccionar'
  | 'mover'
  | 'punto'
  | 'borrarPunto'
  | 'borrarSeccion'
  | 'material';type IconoFormaId =
  | HerramientaForma
  | 'deshacer'
  | 'rehacer'
  | 'rectangulo'
  | 'vaciar'
  | 'ojo'
  | 'ojoCerrado'
  | 'mas'
  | 'papelera'
  | 'subir'
  | 'bajar'
  | 'lapiz'
  | 'ayuda';

interface HerramientaFormaInfo {
  id: HerramientaForma;
  /** Nombre que se ve al expandir la barra. */
  nombre: string;
  titulo: string;
}

const HERRAMIENTAS_FORMA: HerramientaFormaInfo[] = [
  {
    id: 'seleccionar',
    nombre: 'Seleccionar',
    titulo: 'Seleccionar y mover vértices (Supr los borra)',
  },
  { id: 'mover', nombre: 'Mover', titulo: 'Mover la figura completa' },
  {
    id: 'punto',
    nombre: 'Punto',
    titulo: 'Punto: añadir vértices y cerrar la figura tocando un punto anterior',
  },
  { id: 'borrarPunto', nombre: 'Borrar punto', titulo: 'Borrar punto: quitar vértices con un toque' },
  {
    id: 'borrarSeccion',
    nombre: 'Borrar figura',
    titulo: 'Borrar figura: eliminar una figura completa',
  },
  {
    id: 'material',
    nombre: 'Material',
    titulo: 'Material: toca una figura para cambiar su material',
  },
];

const MAXIMO_PUNTOS = 80;

/** Píxeles que hay que mover el dedo para que un toque se convierta en arrastre. */
const UMBRAL_ARRASTRE = 6;

/**
 * Gesto que empieza sobre un vértice o una figura y todavía no se sabe si es un
 * toque (actúa la herramienta actual) o un arrastre (edita la forma).
 */
interface GestoPendiente {
  tipo: 'vertice' | 'seccion';
  trazo: number;
  indice: number;
  punteroId: number;
  /** Coordenadas de pantalla donde empezó el gesto. */
  x: number;
  y: number;
}

function ajustarPunto(punto: PuntoForma, forma: FormaPieza): PuntoForma {
  const redondear = (valor: number, maximo: number): number =>
    Math.min(Math.max(0, Math.round(valor * 2) / 2), maximo);
  return { x: redondear(punto.x, forma.anchoCm), y: redondear(punto.y, forma.altoCm) };
}

function distancia(a: PuntoForma, b: PuntoForma): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function IconoForma({
  id,
  tamano = 17,
}: {
  id: IconoFormaId;
  tamano?: number;
}): JSX.Element {
  const ficha = {
    viewBox: '0 0 24 24',
    width: tamano,
    height: tamano,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;

  switch (id) {
    case 'seleccionar':
      return (
        <svg {...ficha}>
          <path d="M5 3.5 11.4 18l1.8-5.8L19 10.4z" fill="currentColor" />
        </svg>
      );
    case 'mover':
      return (
        <svg {...ficha}>
          <path d="M12 3v18M3 12h18" />
          <path d="m9.4 5.6 2.6-2.6 2.6 2.6" />
          <path d="m9.4 18.4 2.6 2.6 2.6-2.6" />
          <path d="m5.6 9.4-2.6 2.6 2.6 2.6" />
          <path d="m18.4 9.4 2.6 2.6-2.6 2.6" />
        </svg>
      );
    case 'punto':
      return (
        <svg {...ficha}>
          <circle cx="10" cy="14" r="3.2" />
          <path d="M17.5 3.5v6M14.5 6.5h6" />
        </svg>
      );
    case 'borrarPunto':
      return (
        <svg {...ficha}>
          <circle cx="10" cy="14" r="3.2" />
          <path d="M14.8 3.8l5.4 5.4M20.2 3.8l-5.4 5.4" />
        </svg>
      );
    case 'borrarSeccion':
      return (
        <svg {...ficha}>
          <path d="M4 6.5 10 3l7 3.5v8L10 18l-6-3.5z" />
          <path d="M9.4 8.6l3.2 3.2M12.6 8.6l-3.2 3.2" />
        </svg>
      );
    case 'material':
      return (
        <svg {...ficha}>
          <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.1 0 1.9-.8 1.9-1.8 0-.5-.2-.9-.5-1.2a1.7 1.7 0 0 1 1.2-2.9h1.3a4.3 4.3 0 0 0 4.3-4.3c0-3.7-3.4-6.8-8.2-6.8Z" />
          <circle cx="7.6" cy="11.4" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="10.2" cy="7.7" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="14.4" cy="7.9" r="1.05" fill="currentColor" stroke="none" />
          <circle cx="17" cy="11.2" r="1.05" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'deshacer':
      return (
        <svg {...ficha}>
          <path d="M9 13.5 4.5 9 9 4.5" />
          <path d="M4.5 9h9.7a5 5 0 0 1 0 10h-2.4" />
        </svg>
      );
    case 'rehacer':
      return (
        <svg {...ficha}>
          <path d="m15 13.5 4.5-4.5L15 4.5" />
          <path d="M19.5 9H9.8a5 5 0 0 0 0 10h2.4" />
        </svg>
      );
    case 'rectangulo':
      return (
        <svg {...ficha}>
          <rect x="4" y="5.5" width="16" height="13" rx="1.4" />
        </svg>
      );
    case 'vaciar':
      return (
        <svg {...ficha}>
          <path d="m7 20.5-3.4-3.4a1.9 1.9 0 0 1 0-2.7l7.8-7.8a1.9 1.9 0 0 1 2.7 0l4.8 4.8a1.9 1.9 0 0 1 0 2.7l-6.4 6.4" />
          <path d="M20.5 20.5h-13" />
          <path d="m5.5 13.5 7 7" />
        </svg>
      );
    case 'ojo':
      return (
        <svg {...ficha}>
          <path d="M3 12c0-1.5 4-6 9-6s9 4.5 9 6-4 6-9 6-9-4.5-9-6Z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      );
    case 'ojoCerrado':
      return (
        <svg {...ficha}>
          <path d="M4 4.5 20 19.5" />
          <path d="M6.5 7.4C4.6 8.7 3 10.7 3 12c0 1.5 4 6 9 6 1.6 0 3-.5 4.2-1.1M10.3 6.2A9.6 9.6 0 0 1 12 6c5 0 9 4.5 9 6 0 .8-1.1 2.3-2.8 3.6" />
        </svg>
      );
    case 'mas':
      return (
        <svg {...ficha}>
          <path d="M12 5.5v13M5.5 12h13" />
        </svg>
      );
    case 'papelera':
      return (
        <svg {...ficha}>
          <path d="M5 7h14" />
          <path d="M9.5 7V4.8h5V7" />
          <path d="M6.5 7l.9 12.2h9.2L17.5 7" />
          <path d="M10.3 10.5v5.5M13.7 10.5v5.5" />
        </svg>
      );
    case 'subir':
      return (
        <svg {...ficha}>
          <path d="M12 19V5" />
          <path d="m6.5 10.5 5.5-5.5 5.5 5.5" />
        </svg>
      );
    case 'bajar':
      return (
        <svg {...ficha}>
          <path d="M12 5v14" />
          <path d="m6.5 13.5 5.5 5.5 5.5-5.5" />
        </svg>
      );
    case 'ayuda':
      return (
        <svg {...ficha}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4" />
          <path d="M12 16.8v.01" />
        </svg>
      );
    case 'lapiz':
      return (
        <svg {...ficha}>
          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      );
  }
}

/**
 * Editor de formas libres sobre una rejilla en centímetros, con barra de
 * herramientas vertical y panel de capas: cada figura cerrada es una capa que
 * se puede ocultar, pintar con su material (o dejar como hueco) y reordenar. Al
 * tocar un punto existente que no sea el último, el trazo en curso se cierra
 * como figura nueva y se ofrece elegir su material. Todo pasa por el historial:
 * Ctrl+Z deshace y Ctrl+Shift+Z rehace cualquier acción.
 */
export default function EditorFormaPieza({
  forma,
  tipo,
  clave,
  onCambiar,
  materiales = [],
  onCrearMaterial,
}: EditorFormaPiezaProps) {
  const [herramienta, setHerramienta] = useState<HerramientaForma>('punto');
  const [trazoActivo, setTrazoActivo] = useState(() => Math.max(0, forma.trazos.length - 1));
  const [verticeSel, setVerticeSel] = useState<{ trazo: number; indice: number } | null>(null);
  const [puntoCursor, setPuntoCursor] = useState<PuntoForma | null>(null);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);
  const [puedeRehacer, setPuedeRehacer] = useState(false);
  /** Capa cuyo material se está eligiendo en el modal. */
  const [capaMaterial, setCapaMaterial] = useState<number | null>(null);
  /** Capa que se está renombrando y borrador de su nombre. */
  const [capaRenombrando, setCapaRenombrando] = useState<number | null>(null);
  const [nombreCapa, setNombreCapa] = useState('');
  const [barraExpandida, setBarraExpandida] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const historialRef = useRef<FormaPieza[]>([]);
  /** Estados deshechos, para poder rehacerlos. */
  const futuroRef = useRef<FormaPieza[]>([]);
  /** Arrastre activo en un ref: el primer movimiento no espera a un render. */
  const arrastreRef = useRef<{ trazo: number; indice: number } | null>(null);
  /** Arrastre de una figura completa (herramienta Mover). */
  const moverRef = useRef<{ trazo: number; inicio: PuntoForma; puntos: PuntoForma[] } | null>(null);
  /** Gesto sobre un vértice o figura que aún puede ser toque o arrastre. */
  const gestoPendienteRef = useRef<GestoPendiente | null>(null);
  /** true tras un arrastre para que el clic posterior no ejecute el toque. */
  const suprimirClicRef = useRef(false);
  const paleta = useMemo(() => obtenerPaletaPiezas(), []);

  const trazos = forma.trazos;
  const indiceActivo = Math.min(trazoActivo, Math.max(0, trazos.length - 1));
  const margen = Math.max(1, Math.max(forma.anchoCm, forma.altoCm) * 0.05);
  /** Borde superior extra del lienzo: ahí flotan deshacer y rehacer. */
  const margenSuperior = Math.min(
    Math.max(3.5, Math.max(forma.anchoCm, forma.altoCm) * 0.16),
    Math.max(3.5, forma.altoCm * 0.45),
  );
  const anchoVista = forma.anchoCm + margen * 2;
  const altoVista = forma.altoCm + margen + margenSuperior;
  const ratioLienzo = altoVista > 0 ? anchoVista / altoVista : 1;
  const radioVertice = Math.max(0.45, Math.max(forma.anchoCm, forma.altoCm) * 0.018);

  const primitivas = useMemo(
    () => primitivasDeForma(forma, forma.anchoCm, forma.altoCm, tipo),
    [forma, tipo],
  );

  const lineas = useMemo(() => {
    const finas: number[] = [];
    const fuertes: number[] = [];
    for (let x = 0; x <= forma.anchoCm + 0.001; x += 1) {
      (x % 5 === 0 ? fuertes : finas).push(x);
    }
    const finasY: number[] = [];
    const fuertesY: number[] = [];
    for (let y = 0; y <= forma.altoCm + 0.001; y += 1) {
      (y % 5 === 0 ? fuertesY : finasY).push(y);
    }
    return { finas, fuertes, finasY, fuertesY };
  }, [forma.anchoCm, forma.altoCm]);

  function sincronizarHistorial(): void {
    setPuedeDeshacer(historialRef.current.length > 0);
    setPuedeRehacer(futuroRef.current.length > 0);
  }

  /** Guarda el estado actual antes de un cambio para poder deshacerlo. */
  function registrar(): void {
    historialRef.current.push(forma);
    if (historialRef.current.length > 60) {
      historialRef.current.shift();
    }
    futuroRef.current = [];
    sincronizarHistorial();
  }

  function deshacer(): void {
    const anterior = historialRef.current.pop();
    if (!anterior) {
      return;
    }
    setVerticeSel(null);
    arrastreRef.current = null;
    futuroRef.current.push(forma);
    onCambiar(anterior);
    sincronizarHistorial();
  }

  function rehacer(): void {
    const siguiente = futuroRef.current.pop();
    if (!siguiente) {
      return;
    }
    setVerticeSel(null);
    arrastreRef.current = null;
    historialRef.current.push(forma);
    onCambiar(siguiente);
    sincronizarHistorial();
  }

  const deshacerRef = useRef(deshacer);
  deshacerRef.current = deshacer;
  const rehacerRef = useRef(rehacer);
  rehacerRef.current = rehacer;

  useEffect(() => {
    historialRef.current = [];
    futuroRef.current = [];
    sincronizarHistorial();
    setVerticeSel(null);
    setCapaMaterial(null);
    setCapaRenombrando(null);
    arrastreRef.current = null;
    // Al cambiar de pieza se activa el último trazo: el que está en curso.
    setTrazoActivo(Math.max(0, forma.trazos.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave]);

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      const objetivo = evento.target as HTMLElement | null;
      if (
        objetivo &&
        (objetivo.tagName === 'INPUT' ||
          objetivo.tagName === 'TEXTAREA' ||
          objetivo.isContentEditable)
      ) {
        return;
      }
      if ((evento.ctrlKey || evento.metaKey) && !evento.altKey) {
        const tecla = evento.key.toLowerCase();
        if (tecla === 'z') {
          evento.preventDefault();
          if (evento.shiftKey) {
            rehacerRef.current();
          } else {
            deshacerRef.current();
          }
          return;
        }
        if (tecla === 'y' && !evento.shiftKey) {
          evento.preventDefault();
          rehacerRef.current();
          return;
        }
      }
      if ((evento.key === 'Delete' || evento.key === 'Backspace') && verticeSel) {
        evento.preventDefault();
        registrar();
        actualizarTrazo(verticeSel.trazo, {
          puntos: trazos[verticeSel.trazo].puntos.filter((_, posicion) => posicion !== verticeSel.indice),
        });
        setVerticeSel(null);
        return;
      }
      if (evento.key === 'Escape') {
        setVerticeSel(null);
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verticeSel, trazos]);

  // Cualquier pointerup, incluso fuera del lienzo, termina el gesto en curso.
  useEffect(() => {
    function terminarGesto(): void {
      gestoPendienteRef.current = null;
      arrastreRef.current = null;
      moverRef.current = null;
    }
    window.addEventListener('pointerup', terminarGesto);
    window.addEventListener('pointercancel', terminarGesto);
    return () => {
      window.removeEventListener('pointerup', terminarGesto);
      window.removeEventListener('pointercancel', terminarGesto);
    };
  }, []);

  /** Evita que el clic posterior a un arrastre ejecute la acción del toque. */
  function consumirClicDeArrastre(): boolean {
    if (!suprimirClicRef.current) {
      return false;
    }
    suprimirClicRef.current = false;
    return true;
  }

  function cambiarTrazos(nuevos: TrazoForma[]): void {
    onCambiar({ ...forma, trazos: nuevos });
  }

  function actualizarTrazo(indice: number, cambios: Partial<TrazoForma>): void {
    cambiarTrazos(
      trazos.map((actual, posicion) => {
        if (posicion !== indice) {
          return actual;
        }
        const siguiente = { ...actual, ...cambios };
        if (siguiente.material === undefined) {
          delete siguiente.material;
        }
        if (siguiente.nombre === undefined) {
          delete siguiente.nombre;
        }
        return siguiente;
      }),
    );
  }

  /** Abre el material de una capa desde su tarjeta. */
  function cambiarMaterialCapa(indice: number): void {
    setTrazoActivo(indice);
    setVerticeSel(null);
    setCapaMaterial(indice);
  }

  function empezarRenombrar(indice: number): void {
    setTrazoActivo(indice);
    setCapaRenombrando(indice);
    setNombreCapa(trazos[indice]?.nombre ?? '');
  }

  /** Guarda el nombre de la capa; con menos de dos letras vuelve al nombre por defecto. */
  function confirmarRenombrar(): void {
    if (capaRenombrando === null) {
      return;
    }
    const trazo = trazos[capaRenombrando];
    const nombre = nombreCapa.trim();
    const siguiente = nombre.length >= 2 ? nombre : undefined;
    if (trazo && trazo.nombre !== siguiente) {
      registrar();
      actualizarTrazo(capaRenombrando, { nombre: siguiente });
    }
    setCapaRenombrando(null);
  }

  /** Aplica a la capa el material elegido; sin material se vuelve hueco. */
  function asignarMaterialCapa(material: MaterialPieza | null): void {
    if (capaMaterial === null) {
      return;
    }
    registrar();
    actualizarTrazo(
      capaMaterial,
      material
        ? { rol: 'contorno', material: { nombre: material.nombre, color: material.color } }
        : { rol: 'vacio', material: undefined },
    );
    setCapaMaterial(null);
  }

  /** La capa vuelve a usar el material general de la pieza. */
  function usarMaterialDePieza(): void {
    if (capaMaterial === null) {
      return;
    }
    registrar();
    actualizarTrazo(capaMaterial, { rol: 'contorno', material: undefined });
    setCapaMaterial(null);
  }

  function puntoDesdeEvento(evento: {
    clientX: number;
    clientY: number;
    currentTarget: SVGGraphicsElement;
  }): PuntoForma | null {
    const matriz = evento.currentTarget.getScreenCTM();
    if (!matriz) return null;
    const punto = new DOMPoint(evento.clientX, evento.clientY).matrixTransform(matriz.inverse());
    return ajustarPunto({ x: punto.x, y: punto.y }, forma);
  }

  /** Captura el puntero en el lienzo para seguir el arrastre aunque salga del elemento. */
  function capturarPuntero(elemento: SVGGraphicsElement, punteroId: number): void {
    try {
      const lienzo = elemento.ownerSVGElement ?? elemento;
      lienzo.setPointerCapture(punteroId);
    } catch {
      // Sin captura el arrastre sigue funcionando mientras el dedo no salga del lienzo.
    }
  }

  /** Busca el vértice más cercano al punto tocado (para cerrar figuras). */
  function verticeCercano(punto: PuntoForma): { trazo: number; indice: number } | null {
    const radio = radioVertice * 2;
    let mejor: { trazo: number; indice: number } | null = null;
    let mejorDistancia = radio;
    trazos.forEach((trazo, trazoIndice) => {
      if (trazo.visible === false) return;
      trazo.puntos.forEach((actual, indice) => {
        const distanciaActual = distancia(actual, punto);
        if (distanciaActual <= mejorDistancia) {
          mejorDistancia = distanciaActual;
          mejor = { trazo: trazoIndice, indice };
        }
      });
    });
    return mejor;
  }

  /** Cierra el trazo en curso usando el vértice tocado; true si se cerró. */
  function cerrarEnVertice(trazoIndice: number, indice: number): boolean {
    const trazo = trazos[indiceActivo];
    if (!trazo || trazo.cerrado !== false || trazo.puntos.length < 3) return false;
    const esUltimoActivo = trazoIndice === indiceActivo && indice === trazo.puntos.length - 1;
    if (esUltimoActivo) return false;
    const cierre = trazos[trazoIndice].puntos[indice];
    const puntos = [...trazo.puntos];
    if (distancia(puntos[0], cierre) > 0.01) {
      puntos.push(cierre);
    }
    registrar();
    // La figura se cierra en su propia capa: no se crean capas solas.
    actualizarTrazo(indiceActivo, { puntos, cerrado: true });
    setPuntoCursor(null);
    setVerticeSel(null);
    // Al crear la figura se ofrece elegir su material.
    setCapaMaterial(indiceActivo);
    return true;
  }

  function alTocarLienzo(evento: EventoRaton<SVGSVGElement>): void {
    if (consumirClicDeArrastre()) {
      return;
    }
    if (herramienta !== 'punto' || arrastreRef.current) {
      setVerticeSel(null);
      return;
    }
    const punto = puntoDesdeEvento(evento);
    if (!punto) return;
    const trazo = trazos[indiceActivo];
    if (!trazo) return;

    const cerca = verticeCercano(punto);
    if (cerca) {
      cerrarEnVertice(cerca.trazo, cerca.indice);
      return;
    }

    // Una figura cerrada no recibe más puntos: hay que crear otra capa con +.
    if (trazo.cerrado !== false) return;

    if (trazo.puntos.length >= MAXIMO_PUNTOS) return;
    const ultimo = trazo.puntos[trazo.puntos.length - 1];
    if (ultimo && distancia(punto, ultimo) < 0.5) return;
    registrar();
    actualizarTrazo(indiceActivo, { puntos: [...trazo.puntos, punto] });
  }

  function alMoverLienzo(evento: EventoPuntero<SVGSVGElement>): void {
    // Un gesto sobre un vértice o una figura se vuelve arrastre en cuanto el dedo
    // se mueve lo suficiente: la herramienta cambia sola a la de edición.
    const pendiente = gestoPendienteRef.current;
    if (
      pendiente &&
      pendiente.punteroId === evento.pointerId &&
      !arrastreRef.current &&
      !moverRef.current
    ) {
      const recorrido = Math.hypot(evento.clientX - pendiente.x, evento.clientY - pendiente.y);
      if (recorrido < UMBRAL_ARRASTRE) {
        return;
      }
      const punto = puntoDesdeEvento(evento);
      if (!punto) return;
      gestoPendienteRef.current = null;
      suprimirClicRef.current = true;
      if (pendiente.tipo === 'vertice') {
        if (herramienta !== 'seleccionar') {
          setHerramienta('seleccionar');
        }
        setVerticeSel({ trazo: pendiente.trazo, indice: pendiente.indice });
        setTrazoActivo(pendiente.trazo);
        registrar();
        arrastreRef.current = { trazo: pendiente.trazo, indice: pendiente.indice };
      } else {
        const trazo = trazos[pendiente.trazo];
        if (!trazo) return;
        if (herramienta !== 'mover') {
          setHerramienta('mover');
        }
        setTrazoActivo(pendiente.trazo);
        setVerticeSel(null);
        registrar();
        moverRef.current = { trazo: pendiente.trazo, inicio: punto, puntos: trazo.puntos };
      }
      capturarPuntero(evento.currentTarget, evento.pointerId);
    }

    const mover = moverRef.current;
    if (mover) {
      const punto = puntoDesdeEvento(evento);
      const trazo = trazos[mover.trazo];
      if (!punto || !trazo) return;
      const minX = Math.min(...mover.puntos.map((actual) => actual.x));
      const maxX = Math.max(...mover.puntos.map((actual) => actual.x));
      const minY = Math.min(...mover.puntos.map((actual) => actual.y));
      const maxY = Math.max(...mover.puntos.map((actual) => actual.y));
      // El desplazamiento va en pasos de medio centímetro y no sale del lienzo.
      let dx = Math.round((punto.x - mover.inicio.x) * 2) / 2;
      let dy = Math.round((punto.y - mover.inicio.y) * 2) / 2;
      dx = Math.min(Math.max(dx, -minX), forma.anchoCm - maxX);
      dy = Math.min(Math.max(dy, -minY), forma.altoCm - maxY);
      actualizarTrazo(mover.trazo, {
        puntos: mover.puntos.map((actual) => ({ x: actual.x + dx, y: actual.y + dy })),
      });
      return;
    }

    const arrastre = arrastreRef.current;
    if (!arrastre) {
      if (herramienta === 'punto') {
        const punto = puntoDesdeEvento(evento);
        if (
          punto &&
          (!puntoCursor || punto.x !== puntoCursor.x || punto.y !== puntoCursor.y)
        ) {
          setPuntoCursor(punto);
        }
      }
      return;
    }
    const punto = puntoDesdeEvento(evento);
    if (!punto) return;
    const trazo = trazos[arrastre.trazo];
    if (!trazo) return;
    actualizarTrazo(arrastre.trazo, {
      puntos: trazo.puntos.map((actual, posicion) => (posicion === arrastre.indice ? punto : actual)),
    });
  }

  /** Empieza un gesto sobre una figura: el toque decide, el arrastre la mueve. */
  function alPresionarSeccion(evento: EventoPuntero<SVGPolygonElement>, indice: number): void {
    evento.stopPropagation();
    gestoPendienteRef.current = {
      tipo: 'seccion',
      trazo: indice,
      indice,
      punteroId: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
    };
    suprimirClicRef.current = false;
    if (herramienta === 'mover') {
      setTrazoActivo(indice);
      setVerticeSel(null);
    }
  }

  /** Elimina una figura completa conservando al menos una capa. */
  function eliminarTrazo(indice: number): void {
    if (trazos.length <= 1) return;
    registrar();
    cambiarTrazos(trazos.filter((_, posicion) => posicion !== indice));
    setTrazoActivo(0);
    setVerticeSel(null);
  }

  function alTocarSeccion(evento: EventoRaton<SVGPolygonElement>, indice: number): void {
    if (consumirClicDeArrastre()) {
      return;
    }
    const trazo = trazos[indice];
    if (!trazo) return;

    if (herramienta === 'seleccionar') {
      evento.stopPropagation();
      setTrazoActivo(indice);
      setVerticeSel(null);
      return;
    }
    if (herramienta === 'borrarSeccion') {
      evento.stopPropagation();
      eliminarTrazo(indice);
      return;
    }
    if (herramienta === 'material') {
      evento.stopPropagation();
      setTrazoActivo(indice);
      setVerticeSel(null);
      setCapaMaterial(indice);
    }
    // Con las demás herramientas el toque sigue al lienzo (p. ej. añadir un punto).
  }

  /** Empieza un gesto sobre un vértice: el toque actúa, el arrastre lo edita. */
  function alPresionarVertice(
    evento: EventoPuntero<SVGCircleElement>,
    trazoIndice: number,
    indice: number,
  ): void {
    evento.stopPropagation();
    gestoPendienteRef.current = {
      tipo: 'vertice',
      trazo: trazoIndice,
      indice,
      punteroId: evento.pointerId,
      x: evento.clientX,
      y: evento.clientY,
    };
    suprimirClicRef.current = false;
    if (herramienta === 'seleccionar') {
      // Realimentación inmediata: el vértice queda marcado al tocarlo.
      setVerticeSel({ trazo: trazoIndice, indice });
      setTrazoActivo(trazoIndice);
    }
  }

  function alTocarVertice(
    evento: EventoRaton<SVGCircleElement>,
    trazoIndice: number,
    indice: number,
  ): void {
    if (consumirClicDeArrastre()) {
      return;
    }
    evento.stopPropagation();
    if (herramienta === 'borrarPunto') {
      quitarPunto(trazoIndice, indice);
      return;
    }
    if (herramienta === 'punto') {
      cerrarEnVertice(trazoIndice, indice);
      return;
    }
    if (herramienta === 'material') {
      setTrazoActivo(trazoIndice);
      setVerticeSel(null);
      setCapaMaterial(trazoIndice);
      return;
    }
    if (herramienta === 'borrarSeccion') {
      eliminarTrazo(trazoIndice);
      return;
    }
    setVerticeSel({ trazo: trazoIndice, indice });
    setTrazoActivo(trazoIndice);
  }

  function quitarPunto(trazoIndice: number, indice: number): void {
    const trazo = trazos[trazoIndice];
    if (!trazo) return;
    registrar();
    actualizarTrazo(trazoIndice, {
      puntos: trazo.puntos.filter((_, posicion) => posicion !== indice),
    });
    setVerticeSel(null);
  }

  function rectangulo(): void {
    const trazo = trazos[indiceActivo];
    if (!trazo) return;
    registrar();
    const insetX = Math.max(1, forma.anchoCm * 0.1);
    const insetY = Math.max(1, forma.altoCm * 0.1);
    actualizarTrazo(indiceActivo, {
      cerrado: true,
      visible: true,
      puntos: [
        { x: insetX, y: insetY },
        { x: forma.anchoCm - insetX, y: insetY },
        { x: forma.anchoCm - insetX, y: forma.altoCm - insetY },
        { x: insetX, y: forma.altoCm - insetY },
      ],
    });
    // La figura nueva pide su material igual que al cerrar un trazo.
    setCapaMaterial(indiceActivo);
  }

  function nuevaCapa(): void {
    registrar();
    cambiarTrazos([...trazos, { rol: 'contorno', cerrado: false, visible: true, puntos: [] }]);
    setTrazoActivo(trazos.length);
    setHerramienta('punto');
  }

  function eliminarCapa(): void {
    if (trazos.length <= 1) return;
    registrar();
    cambiarTrazos(trazos.filter((_, posicion) => posicion !== indiceActivo));
    setTrazoActivo(0);
    setVerticeSel(null);
  }

  /** Mueve la capa activa en el orden de pintado (primero = abajo). */
  function moverCapa(delta: number): void {
    const destino = indiceActivo + delta;
    if (destino < 0 || destino >= trazos.length) return;
    registrar();
    const siguientes = [...trazos];
    [siguientes[indiceActivo], siguientes[destino]] = [siguientes[destino], siguientes[indiceActivo]];
    cambiarTrazos(siguientes);
    setTrazoActivo(destino);
  }

  const viewBox = `${-margen} ${-margenSuperior} ${anchoVista} ${altoVista}`;
  const trazoActivoActual = trazos[indiceActivo] ?? null;
  const primeroActivo = trazoActivoActual?.puntos[0] ?? null;
  const ultimoActivo = trazoActivoActual
    ? trazoActivoActual.puntos[trazoActivoActual.puntos.length - 1] ?? null
    : null;
  const activoVisible = trazoActivoActual?.visible !== false;
  const enCurso = trazoActivoActual?.cerrado === false && activoVisible;
  const mostrarGuia = herramienta === 'punto' && puntoCursor !== null && enCurso && ultimoActivo !== null;

  return (
    <div className="editor-forma">
      <div className="editor-forma-cuerpo">
        {/* Barra estilo editor de planos: se expande con un clic para ver los nombres. */}
        <div
          className={`editor-forma-herramientas barra-herramientas ${
            barraExpandida ? 'expandida' : ''
          }`}
          role="toolbar"
          aria-label="Herramientas de forma"
        >
          <button
            type="button"
            className="barra-boton-expandir"
            onClick={() => setBarraExpandida((abierta) => !abierta)}
            title={barraExpandida ? 'Contraer barra' : 'Expandir barra'}
          >
            <svg
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className="herramienta-nombre barra-expandir-nombre">Herramientas</span>
          </button>
          <span className="barra-herramientas-separador" />

          {HERRAMIENTAS_FORMA.map((info) => (
            <button
              key={info.id}
              type="button"
              className={`herramienta-boton ${herramienta === info.id ? 'activa' : ''}`}
              onClick={() => {
                setHerramienta(info.id);
                setPuntoCursor(null);
                if (info.id !== 'seleccionar') setVerticeSel(null);
              }}
              title={info.titulo}
              aria-label={info.titulo}
              aria-pressed={herramienta === info.id}
            >
              <span className="icono-herramienta">
                <IconoForma id={info.id} tamano={20} />
              </span>
              <span className="herramienta-nombre">{info.nombre}</span>
            </button>
          ))}

          <span className="barra-herramientas-separador" />

          <button
            type="button"
            className="herramienta-boton"
            onClick={rectangulo}
            title="Rectángulo en la capa activa"
            aria-label="Rectángulo"
          >
            <span className="icono-herramienta">
              <IconoForma id="rectangulo" tamano={20} />
            </span>
            <span className="herramienta-nombre">Rectángulo</span>
          </button>
          <button
            type="button"
            className="herramienta-boton"
            onClick={() => {
              if (!trazoActivoActual) return;
              registrar();
              actualizarTrazo(indiceActivo, { puntos: [], cerrado: false });
            }}
            title="Vaciar la capa activa"
            aria-label="Vaciar"
          >
            <span className="icono-herramienta">
              <IconoForma id="vaciar" tamano={20} />
            </span>
            <span className="herramienta-nombre">Vaciar</span>
          </button>

          <span className="barra-herramientas-separador" />

          <button
            type="button"
            className={`herramienta-boton ${ayudaAbierta ? 'activa' : ''}`}
            onClick={() => setAyudaAbierta((abierta) => !abierta)}
            title="Instrucciones del editor de piezas"
            aria-label="Instrucciones del editor de piezas"
          >
            <span className="icono-herramienta">
              <IconoForma id="ayuda" tamano={20} />
            </span>
            <span className="herramienta-nombre">Ayuda</span>
          </button>
        </div>

        <div
          className="editor-forma-lienzo-marco"
          style={{ '--lienzo-ratio': ratioLienzo } as CSSProperties}
        >
          <svg
            className={`editor-forma-lienzo ${herramienta}`}
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
            style={{ aspectRatio: `${anchoVista} / ${altoVista}` }}
            role="img"
            aria-label="Lienzo de diseño de la pieza"
            onClick={alTocarLienzo}
            onPointerDown={() => {
              // Un toque nuevo cancela la supresión pendiente de un arrastre previo.
              suprimirClicRef.current = false;
            }}
            onPointerMove={alMoverLienzo}
            onPointerUp={() => {
              gestoPendienteRef.current = null;
              arrastreRef.current = null;
              moverRef.current = null;
            }}
            onPointerCancel={() => {
              gestoPendienteRef.current = null;
              arrastreRef.current = null;
              moverRef.current = null;
              setPuntoCursor(null);
            }}
            onPointerLeave={(evento) => {
              setPuntoCursor(null);
              // Con el puntero capturado el arrastre continúa fuera del lienzo.
              if (!evento.currentTarget.hasPointerCapture(evento.pointerId)) {
                gestoPendienteRef.current = null;
                arrastreRef.current = null;
                moverRef.current = null;
              }
            }}
          >
          <rect
            x={0}
            y={0}
            width={forma.anchoCm}
            height={forma.altoCm}
            fill="var(--bg-secondary)"
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
          {lineas.finas.map((x) => (
            <line
              key={`fx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={forma.altoCm}
              stroke="var(--linea-fina)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {lineas.finasY.map((y) => (
            <line
              key={`fy-${y}`}
              x1={0}
              y1={y}
              x2={forma.anchoCm}
              y2={y}
              stroke="var(--linea-fina)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {lineas.fuertes.map((x) => (
            <line
              key={`sx-${x}`}
              x1={x}
              y1={0}
              x2={x}
              y2={forma.altoCm}
              stroke="var(--border)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}
          {lineas.fuertesY.map((y) => (
            <line
              key={`sy-${y}`}
              x1={0}
              y1={y}
              x2={forma.anchoCm}
              y2={y}
              stroke="var(--border)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <PrimitivasSvg primitivas={primitivas} paleta={paleta} escalaTrazo={1} />

          {trazos.map((actual, indice) =>
            actual.visible !== false && actual.cerrado !== false && actual.puntos.length >= 3 ? (
              <polygon
                key={`seccion-${indice}`}
                className="editor-forma-seccion"
                points={actual.puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')}
                fill="transparent"
                stroke="none"
                pointerEvents="all"
                onPointerDown={(evento) => alPresionarSeccion(evento, indice)}
                onClick={(evento) => alTocarSeccion(evento, indice)}
              />
            ) : null,
          )}

          {enCurso && trazoActivoActual && trazoActivoActual.puntos.length > 0 && (
            <>
              <polyline
                points={trazoActivoActual.puntos.map((punto) => `${punto.x},${punto.y}`).join(' ')}
                fill="none"
                stroke="var(--informacion)"
                strokeWidth={1.8}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              {primeroActivo && ultimoActivo && trazoActivoActual.puntos.length >= 3 && (
                <line
                  x1={ultimoActivo.x}
                  y1={ultimoActivo.y}
                  x2={primeroActivo.x}
                  y2={primeroActivo.y}
                  stroke="var(--informacion)"
                  strokeWidth={1.3}
                  strokeDasharray="3 4"
                  opacity={0.45}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="none"
                />
              )}
            </>
          )}

          {mostrarGuia && puntoCursor && ultimoActivo && (
            <>
              <line
                className="editor-forma-guia"
                x1={ultimoActivo.x}
                y1={ultimoActivo.y}
                x2={puntoCursor.x}
                y2={puntoCursor.y}
                stroke="var(--informacion)"
                strokeWidth={1.6}
                strokeDasharray="5 4"
                opacity={0.85}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
              <circle
                className="editor-forma-guia"
                cx={puntoCursor.x}
                cy={puntoCursor.y}
                r={radioVertice * 0.8}
                fill="none"
                stroke="var(--informacion)"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
              />
            </>
          )}

          {trazos.map((actual, trazoIndice) => {
            if (actual.visible === false) return null;
            return actual.puntos.map((punto, indice) => {
              const activo = trazoIndice === indiceActivo;
              const esUltimo = activo && indice === actual.puntos.length - 1 && actual.cerrado === false;
              const seleccionado =
                verticeSel?.trazo === trazoIndice && verticeSel?.indice === indice;
              return (
                <g key={`v-${trazoIndice}-${indice}`}>
                  <circle
                    cx={punto.x}
                    cy={punto.y}
                    r={radioVertice * 1.9}
                    fill="transparent"
                    stroke="none"
                    className="editor-forma-vertice-hit"
                    pointerEvents="all"
                    onPointerDown={(evento) => alPresionarVertice(evento, trazoIndice, indice)}
                    onClick={(evento) => alTocarVertice(evento, trazoIndice, indice)}
                  />
                  <circle
                    cx={punto.x}
                    cy={punto.y}
                    r={radioVertice}
                    fill={seleccionado ? 'var(--informacion)' : esUltimo ? 'var(--text-secondary)' : 'var(--bg-primary)'}
                    stroke={seleccionado || activo ? 'var(--informacion)' : 'var(--border-strong)'}
                    strokeWidth={1.8}
                    vectorEffect="non-scaling-stroke"
                    opacity={activo || seleccionado ? 1 : 0.65}
                    className={`editor-forma-vertice ${esUltimo ? 'editor-forma-vertice-ultimo' : ''}`}
                    pointerEvents="none"
                  />
                </g>
              );
            });
          })}
          </svg>

          {/* Deshacer y rehacer flotan sobre la esquina del lienzo. */}
          <div className="editor-forma-lienzo-controles">
            <button
              type="button"
              className="boton-historial-lienzo"
              onClick={deshacer}
              disabled={!puedeDeshacer}
              title="Deshacer (Ctrl+Z)"
              aria-label="Deshacer"
            >
              <IconoForma id="deshacer" />
            </button>
            <button
              type="button"
              className="boton-historial-lienzo"
              onClick={rehacer}
              disabled={!puedeRehacer}
              title="Rehacer (Ctrl+Shift+Z)"
              aria-label="Rehacer"
            >
              <IconoForma id="rehacer" />
            </button>
          </div>

          <AyudaForma abierta={ayudaAbierta} onCerrar={() => setAyudaAbierta(false)} />
        </div>

        <aside className="editor-forma-capas" aria-label="Capas">
          <header className="editor-forma-capas-cabecera">
            <span>Capas</span>
            <span className="editor-forma-capas-cuenta">{trazos.length}</span>
          </header>
          <ul className="editor-forma-capas-lista">
            {trazos
              .map((trazo, indice) => ({ trazo, indice }))
              .reverse()
              .map(({ trazo, indice }) => (
                <li key={indice}>
                  <div className={`capa-fila ${indice === indiceActivo ? 'activa' : ''}`}>
                    <button
                      type="button"
                      className="capa-ojo"
                      title={trazo.visible === false ? 'Mostrar capa' : 'Ocultar capa'}
                      aria-label={trazo.visible === false ? 'Mostrar capa' : 'Ocultar capa'}
                      onClick={() => {
                        registrar();
                        actualizarTrazo(indice, { visible: trazo.visible === false });
                      }}
                    >
                      <IconoForma id={trazo.visible === false ? 'ojoCerrado' : 'ojo'} />
                    </button>

                    {capaRenombrando === indice ? (
                      <input
                        className="capa-nombre-campo"
                        value={nombreCapa}
                        autoFocus
                        maxLength={40}
                        placeholder={`Capa ${indice + 1}`}
                        aria-label="Nombre de la capa"
                        onChange={(evento) => setNombreCapa(evento.target.value)}
                        onBlur={confirmarRenombrar}
                        onKeyDown={(evento) => {
                          if (evento.key === 'Enter') {
                            evento.preventDefault();
                            confirmarRenombrar();
                          }
                          if (evento.key === 'Escape') {
                            evento.preventDefault();
                            setCapaRenombrando(null);
                          }
                        }}
                      />
                    ) : (
                      <button
                        type="button"
                        className="capa-nombre"
                        onClick={() => {
                          setTrazoActivo(indice);
                          setVerticeSel(null);
                        }}
                        onDoubleClick={() => empezarRenombrar(indice)}
                        title={`${
                          trazo.nombre || `Capa ${indice + 1}`
                        } — activar la capa (doble clic para cambiar el nombre)`}
                      >
                        <span className="capa-titulo">{trazo.nombre || `Capa ${indice + 1}`}</span>
                        <span className="capa-detalle">
                          {trazo.rol === 'vacio' ? 'Hueco' : trazo.material?.nombre ?? 'Pieza'} ·{' '}
                          {trazo.puntos.length} pts
                          {trazo.cerrado === false ? ' · trazando' : ''}
                        </span>
                      </button>
                    )}

                    <div className="capa-acciones">
                      <button
                        type="button"
                        className={`capa-material ${trazo.rol === 'vacio' ? 'vacio' : ''}`}
                        style={
                          trazo.rol === 'vacio'
                            ? undefined
                            : { backgroundColor: trazo.material?.color ?? forma.color }
                        }
                        title={`Material: ${
                          trazo.rol === 'vacio' ? 'hueco' : trazo.material?.nombre ?? 'el de la pieza'
                        } · toca para cambiarlo`}
                        aria-label="Cambiar el material de la capa"
                        onClick={() => cambiarMaterialCapa(indice)}
                      />
                      <button
                        type="button"
                        className="capa-renombrar"
                        title="Cambiar el nombre de la capa"
                        aria-label="Cambiar el nombre de la capa"
                        onClick={() => empezarRenombrar(indice)}
                      >
                        <IconoForma id="lapiz" tamano={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
          <footer className="editor-forma-capas-pie">
            <button type="button" onClick={nuevaCapa} title="Nueva capa" aria-label="Nueva capa">
              <IconoForma id="mas" />
            </button>
            <button
              type="button"
              onClick={eliminarCapa}
              disabled={trazos.length <= 1}
              title="Eliminar la capa activa"
              aria-label="Eliminar la capa activa"
            >
              <IconoForma id="papelera" />
            </button>
            <button
              type="button"
              onClick={() => moverCapa(1)}
              disabled={indiceActivo >= trazos.length - 1}
              title="Subir la capa activa"
              aria-label="Subir la capa activa"
            >
              <IconoForma id="subir" />
            </button>
            <button
              type="button"
              onClick={() => moverCapa(-1)}
              disabled={indiceActivo === 0}
              title="Bajar la capa activa"
              aria-label="Bajar la capa activa"
            >
              <IconoForma id="bajar" />
            </button>
          </footer>
        </aside>
      </div>

      {capaMaterial !== null && (
        <ModalMateriales
          materiales={materiales}
          seleccionado={trazos[capaMaterial]?.material?.nombre}
          titulo="Material de la capa"
          descripcion="Elige con qué material se pinta esta figura, usa el de la pieza o déjala como hueco."
          textoSinMaterial="Hueco (sin material)"
          onMaterialPieza={usarMaterialDePieza}
          onElegir={asignarMaterialCapa}
          onCrear={(material) => {
            onCrearMaterial?.(material);
            asignarMaterialCapa(material);
          }}
          onCerrar={() => setCapaMaterial(null)}
        />
      )}
    </div>
  );
}
