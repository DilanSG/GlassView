import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import { useZoomPan } from '../../hooks/useZoomPan';
import type { ModeloVentaneria, PerfilCategoria, PerfilVentaneria, PiezaPersonalizada, PiezaPlano, HuecoProyecto } from '../../tipos';
import type { HerramientaCad } from '../../constantes';
import type { EstadoGuardado, Interaccion, InteraccionMover, RectanguloNuevo } from '../../tipos/lienzo';
import { MINIMO_SELECCION_PANTALLA, PX_POR_CM, TAMANO_ASA } from '../../constantes';
import { obtenerColorVar, obtenerPaletaPiezas } from '../../utils/colores';
import { redondearAPx, redondearCm } from '../../utils/geometria';
import { categoriaDeHerramienta } from '../../tipos/lienzo';
import { ordenarPiezasParaDibujo } from '../../piezas/contexto';
import { useRejilla } from '../../hooks/useRejilla';
import BarraHerramientas from './BarraHerramientas';
import ControlesZoom from './ControlesZoom';
import ReglasLienzo, { grosorRegla } from './ReglasLienzo';
import RejillaKonva from './RejillaKonva';
import HuecoKonva from './HuecoKonva';
import PiezasKonva from './PiezasKonva';
import AsasSeleccion, { ESQUINAS_ASAS } from './AsasSeleccion';
import CotasKonva from './CotasKonva';
import MedidorPieza from './MedidorPieza';
import AyudaLienzo from './AyudaLienzo';
import SelectorRef from './SelectorRef';
import DialogoPreset from './DialogoPreset';

interface LienzoPlanoProps {
  piezas: PiezaPlano[];
  modelos: ModeloVentaneria[];
  perfiles: PerfilVentaneria[];
  piezasPersonalizadas?: PiezaPersonalizada[];
  /** Medidas del hueco de obra; null/ausente = mapa libre. */
  hueco?: HuecoProyecto | null;
  piezaSeleccionadaId: string | null;
  onSeleccionarPieza: (id: string | null) => void;
  /** Actualiza las piezas en el editor al instante (sin guardar). */
  onCambiarPiezas: (piezas: PiezaPlano[]) => void;
  /** Pide guardar el estado actual en el servidor (fin de gesto, etc.). */
  onGuardarCambios: () => void;
  onPiezaDibujada: (pieza: PiezaPlano) => Promise<void>;
  onPresetDibujado: (
    modeloId: string,
    xCm: number,
    yCm: number,
    anchoCm: number,
    altoCm: number,
  ) => Promise<void>;
  /** Abre el plano en pantalla completa (lo llama el botón del lienzo). */
  onAbrirPantallaCompleta?: () => void;
  /** true cuando esta instancia ya se muestra a pantalla completa. */
  enPantallaCompleta?: boolean;
  /** Modo de solo vista: sin herramientas ni paneles, únicamente se puede
   *  desplazar el plano (y hacer zoom con la rueda) para inspeccionarlo. */
  modoVista?: boolean;
  /** Estado del guardado en el servidor, para el botón dentro del lienzo. */
  estadoGuardado?: EstadoGuardado;
  /** Pide guardar los cambios (lo usa el botón de estado del lienzo). */
  onGuardar?: () => void;
}

const TEXTO_ESTADO_GUARDADO: Record<EstadoGuardado, string> = {
  sincronizado: 'Guardado',
  conCambios: 'Guardar',
  guardando: 'Guardando…',
  error: 'Error al guardar',
};

/** Píxeles que hay que mover el dedo para que un toque se convierta en arrastre. */
const UMBRAL_ARRASTRE = 6;

export default function LienzoPlano({
  piezas,
  modelos,
  perfiles,
  piezasPersonalizadas = [],
  hueco,
  piezaSeleccionadaId,
  onSeleccionarPieza,
  onCambiarPiezas,
  onGuardarCambios,
  onPiezaDibujada,
  onPresetDibujado,
  onAbrirPantallaCompleta,
  enPantallaCompleta = false,
  modoVista = false,
  estadoGuardado,
  onGuardar,
}: LienzoPlanoProps) {
  const [herramienta, setHerramienta] = useState<string>('seleccion');
  const [barraExpandida, setBarraExpandida] = useState(false);
  const [presetsAbierto, setPresetsAbierto] = useState(false);
  const [piezasAbierto, setPiezasAbierto] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [rectPreview, setRectPreview] = useState<RectanguloNuevo | null>(null);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [piezaPendiente, setPiezaPendiente] = useState<{
    pieza: PiezaPlano;
    categoria: PerfilCategoria;
  } | null>(null);
  const [presetPendiente, setPresetPendiente] = useState<{
    modeloId: string;
    xCm: number;
    yCm: number;
  } | null>(null);
  const [anchoPreset, setAnchoPreset] = useState('120');
  const [altoPreset, setAltoPreset] = useState('120');
  const [insertandoPreset, setInsertandoPreset] = useState(false);
  const [idsSeleccionadas, setIdsSeleccionadas] = useState<string[]>([]);
  const [ordenSeleccion, setOrdenSeleccion] = useState<string[]>([]);

  const {
    vista,
    tamanoVista,
    tamanoMedido,
    etapaRef,
    contenedorRef,
    aplicarZoom,
    aplicarZoomEnPunto,
    desplazarVista,
    acercarAlejar,
    iniciarPan,
    aplicarPan,
    terminarPan,
    encuadrar,
  } = useZoomPan();
  const mundoRef = useRef<Konva.Group>(null);
  /** true en cuanto el usuario mueve o hace zoom: el encuadre deja de reajustarse. */
  const usuarioAjustoVistaRef = useRef(false);
  const inicioRef = useRef<{ x: number; y: number } | null>(null);
  const interaccionRef = useRef<Interaccion | null>(null);
  const clicPresetRef = useRef<{ x: number; y: number } | null>(null);
  /** Posición de pantalla de cada puntero activo (para la pinza de dos dedos). */
  const punterosRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  /** Última medida de la pinza: distancia y centro entre dos dedos. */
  const pinzaRef = useRef<{ distancia: number; centro: { x: number; y: number } } | null>(null);
  /** Punto de pantalla donde empezó el paneo (para distinguir toque de arrastre). */
  const panPantallaInicioRef = useRef<{ x: number; y: number } | null>(null);

  const colorFondo = obtenerColorVar('--bg-secondary', '#ebebef');
  const colorBorde = obtenerColorVar('--border-strong', '#aeaeb2');
  const colorTexto = obtenerColorVar('--text-primary', '#1c1c1e');
  const colorAcento = '#2e7d32';
  const paleta = obtenerPaletaPiezas();
  const colorRejillaFina = obtenerColorVar('--linea-fina', 'rgba(0,0,0,0.06)');
  const colorRejillaFuerte = obtenerColorVar('--linea-fuerte', 'rgba(0,0,0,0.12)');
  const colorEtiqueta = obtenerColorVar('--text-tertiary', '#86878c');

  const { rangoMundo, lineasRejilla } = useRejilla(piezas, vista, tamanoVista);

  const piezaSeleccionada = piezas.find((p) => p.id === piezaSeleccionadaId) ?? null;
  // La ficha de la pieza (tipo, REF, medidas y sección) se muestra siempre que
  // haya una única pieza seleccionada con la herramienta de selección.
  const mostrarMedidor =
    Boolean(piezaSeleccionada) && herramienta === 'seleccion' && idsSeleccionadas.length === 0;

  useEffect(() => {
    // En modo de solo vista la única herramienta es la mano; al volver a
    // edición se restaura «Seleccionar» como herramienta predeterminada.
    setHerramienta(modoVista ? 'mano' : 'seleccion');
  }, [modoVista]);

  useEffect(() => {
    const idsValidos = new Set(piezas.map((p) => p.id));
    setIdsSeleccionadas((anterior) => anterior.filter((id) => idsValidos.has(id)));
  }, [piezas]);

  useEffect(() => {
    // La última pieza seleccionada se dibuja encima (y también se detecta
    // primero en el clic, porque el hit-test recorre el orden inverso).
    const seleccionados = [
      ...idsSeleccionadas,
      ...(piezaSeleccionadaId ? [piezaSeleccionadaId] : []),
    ];
    if (seleccionados.length === 0) return;
    setOrdenSeleccion((actual) => {
      const restantes = actual.filter((id) => !seleccionados.includes(id));
      return [...restantes, ...seleccionados];
    });
  }, [piezaSeleccionadaId, idsSeleccionadas]);

  const piezasDibujo = useMemo(
    () => ordenarPiezasParaDibujo(piezas, ordenSeleccion),
    [piezas, ordenSeleccion],
  );

  const limitesHueco =
    hueco && hueco.anchoCm > 0 && hueco.altoCm > 0
      ? { ancho: hueco.anchoCm, alto: hueco.altoCm }
      : null;

  /** Mantiene un punto (en píxeles) dentro del hueco (si existe). */
  function limitarPunto(punto: { x: number; y: number }): { x: number; y: number } {
    if (!limitesHueco) return punto;
    const anchoPx = limitesHueco.ancho * PX_POR_CM;
    const altoPx = limitesHueco.alto * PX_POR_CM;
    return {
      x: Math.min(Math.max(0, punto.x), anchoPx),
      y: Math.min(Math.max(0, punto.y), altoPx),
    };
  }

  /** Recorta el rectángulo de dibujo (en píxeles) al hueco; null si no queda área. */
  function limitarRect(rect: RectanguloNuevo): RectanguloNuevo | null {
    if (!limitesHueco) return rect;
    const anchoPx = limitesHueco.ancho * PX_POR_CM;
    const altoPx = limitesHueco.alto * PX_POR_CM;
    const x = Math.min(Math.max(0, rect.x), anchoPx);
    const y = Math.min(Math.max(0, rect.y), altoPx);
    const ancho = Math.min(rect.ancho, anchoPx - x);
    const alto = Math.min(rect.alto, altoPx - y);
    if (ancho <= 0 || alto <= 0) return null;
    return { x, y, ancho, alto };
  }

  /** Posición válida de una pieza dentro del hueco. */
  function limitarPosicionPieza(x: number, y: number, pieza: PiezaPlano): { x: number; y: number } {
    if (!limitesHueco) return { x, y };
    return {
      x: Math.min(Math.max(0, x), Math.max(0, limitesHueco.ancho - pieza.anchoCm)),
      y: Math.min(Math.max(0, y), Math.max(0, limitesHueco.alto - pieza.altoCm)),
    };
  }

  /** Rango en píxeles que ocupan las piezas (para encuadrar la vista). */
  function rangoPiezas(): { x: number; y: number; ancho: number; alto: number } | null {
    if (piezas.length === 0) return null;
    const minX = Math.min(...piezas.map((pieza) => pieza.x));
    const minY = Math.min(...piezas.map((pieza) => pieza.y));
    const maxX = Math.max(...piezas.map((pieza) => pieza.x + pieza.anchoCm));
    const maxY = Math.max(...piezas.map((pieza) => pieza.y + pieza.altoCm));
    return {
      x: minX * PX_POR_CM,
      y: minY * PX_POR_CM,
      ancho: (maxX - minX) * PX_POR_CM,
      alto: (maxY - minY) * PX_POR_CM,
    };
  }

  /** Rango en píxeles que se encuadra: el hueco si existe, si no las piezas. */
  function rangoInicial(): { x: number; y: number; ancho: number; alto: number } | null {
    if (hueco && hueco.anchoCm > 0 && hueco.altoCm > 0) {
      return {
        x: 0,
        y: 0,
        ancho: hueco.anchoCm * PX_POR_CM,
        alto: hueco.altoCm * PX_POR_CM,
      };
    }
    return rangoPiezas();
  }

  function encuadrarVista(): void {
    usuarioAjustoVistaRef.current = true;
    // En edición se reserva el borde de las reglas para que no tapen el plano.
    encuadrar(rangoInicial(), modoVista ? 0 : grosorRegla(tamanoVista));
  }

  /** Zoom del usuario (botones o rueda): fija la vista y detiene el reencuadre. */
  function ajustarZoomVista(factor: number): void {
    usuarioAjustoVistaRef.current = true;
    aplicarZoom(factor);
  }

  function rodarZoom(evento: Konva.KonvaEventObject<WheelEvent>): void {
    usuarioAjustoVistaRef.current = true;
    acercarAlejar(evento);
  }

  /** Comienza un paneo del usuario (mano o pinza). */
  function iniciarPaneo(pantalla: { x: number; y: number }): void {
    usuarioAjustoVistaRef.current = true;
    panPantallaInicioRef.current = pantalla;
    iniciarPan(pantalla);
  }

  useEffect(() => {
    // El primer encuadre se reajusta con cada medición del lienzo (barras del
    // navegador, paneles…) hasta que el usuario mueve o hace zoom: así el plano
    // abre siempre centrado y a la escala correcta en el móvil.
    if (!tamanoMedido || usuarioAjustoVistaRef.current) return;
    const rango = rangoInicial();
    if (!rango) return;
    encuadrar(rango, modoVista ? 0 : grosorRegla(tamanoVista));
  }, [piezas, hueco, tamanoVista, tamanoMedido, encuadrar, modoVista]);

  const resultados = useMemo(() => {
    if (!piezaPendiente) return [];
    const busca = terminoBusqueda.trim().toLowerCase();
    if (busca) {
      return perfiles.filter(
        (perfil) =>
          perfil.ref.toLowerCase().includes(busca) ||
          perfil.descripcion.toLowerCase().includes(busca),
      );
    }
    return perfiles.filter((perfil) => perfil.categoria === piezaPendiente.categoria);
  }, [perfiles, piezaPendiente, terminoBusqueda]);

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      if (modoVista) return;
      if (evento.key === 'Delete' || evento.key === 'Backspace') {
        const ids = new Set<string>([...idsSeleccionadas]);
        if (piezaSeleccionadaId) ids.add(piezaSeleccionadaId);
        if (ids.size > 0) {
          evento.preventDefault();
          onCambiarPiezas(piezas.filter((p) => !ids.has(p.id)));
          onSeleccionarPieza(null);
          setIdsSeleccionadas([]);
          onGuardarCambios();
        }
      }
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [piezaSeleccionadaId, piezas, idsSeleccionadas]);

  /** Punto del mundo (cm del lienzo) bajo el puntero del evento. */
  function puntoRelativo(evento?: Konva.KonvaEventObject<PointerEvent>): { x: number; y: number } | null {
    const pantalla = evento ? puntoPantalla(evento) : etapaRef.current?.getPointerPosition() ?? null;
    if (!pantalla) {
      return mundoRef.current?.getRelativePointerPosition() ?? null;
    }
    return {
      x: (pantalla.x - vista.x) / vista.zoom,
      y: (pantalla.y - vista.y) / vista.zoom,
    };
  }

  /** Posición del puntero en coordenadas de pantalla (para desplazar la vista). */
  function puntoPantalla(evento?: Konva.KonvaEventObject<PointerEvent>): { x: number; y: number } | null {
    const etapa = etapaRef.current;
    if (!etapa) return null;
    if (evento) {
      const caja = etapa.container().getBoundingClientRect();
      return { x: evento.evt.clientX - caja.left, y: evento.evt.clientY - caja.top };
    }
    return etapa.getPointerPosition() ?? null;
  }

  interface ObjetivoPlano {
    idPieza: string;
    esquina?: string;
    abrirMedidor?: boolean;
  }

  /**
   * Detección manual y determinista del objetivo bajo el cursor, fiable a
   * cualquier zoom: primero las asas y el medidor de la pieza seleccionada,
   * luego las piezas (la última dibujada encima gana), con una caja mínima
   * constante en pantalla para poder pulsar piezas finas.
   */
  function detectarObjetivo(punto: { x: number; y: number }): ObjetivoPlano | null {
    if (herramienta === 'seleccion' && piezaSeleccionada && idsSeleccionadas.length === 0) {
      const pieza = piezaSeleccionada;
      const x = pieza.x * PX_POR_CM;
      const y = pieza.y * PX_POR_CM;
      const ancho = pieza.anchoCm * PX_POR_CM;
      const alto = pieza.altoCm * PX_POR_CM;
      const tamanoAsa = Math.max(4, TAMANO_ASA / vista.zoom);
      for (const esquina of ESQUINAS_ASAS) {
        const ax = x + ancho * esquina.xOff - tamanoAsa / 2;
        const ay = y + alto * esquina.yOff - tamanoAsa / 2;
        if (
          punto.x >= ax &&
          punto.x <= ax + tamanoAsa &&
          punto.y >= ay &&
          punto.y <= ay + tamanoAsa
        ) {
          return { idPieza: pieza.id, esquina: esquina.id };
        }
      }
      const radioMedidor = Math.max(12, 16 / vista.zoom);
      const cx = x + ancho / 2;
      const cy = y + alto / 2;
      const dx = punto.x - cx;
      const dy = punto.y - cy;
      if (dx * dx + dy * dy <= radioMedidor * radioMedidor) {
        return { idPieza: pieza.id, abrirMedidor: true };
      }
    }

    const minimoSel = MINIMO_SELECCION_PANTALLA / vista.zoom;
    for (let i = piezasDibujo.length - 1; i >= 0; i--) {
      const pieza = piezasDibujo[i];
      const anchoPx = Math.max(0, pieza.anchoCm) * PX_POR_CM;
      const altoPx = Math.max(0, pieza.altoCm) * PX_POR_CM;
      const hitAncho = Math.max(anchoPx, minimoSel);
      const hitAlto = Math.max(altoPx, minimoSel);
      const x = pieza.x * PX_POR_CM - (hitAncho - anchoPx) / 2;
      const y = pieza.y * PX_POR_CM - (hitAlto - altoPx) / 2;
      if (
        punto.x >= x &&
        punto.x <= x + hitAncho &&
        punto.y >= y &&
        punto.y <= y + hitAlto
      ) {
        return { idPieza: pieza.id };
      }
    }
    return null;
  }

  /** Captura el puntero para que el arrastre no se corte al salir del lienzo. */
  function capturarPuntero(evento: Konva.KonvaEventObject<PointerEvent>): void {
    try {
      const idPuntero = evento.evt.pointerId;
      etapaRef.current?.getContent().setPointerCapture(idPuntero);
    } catch {
      // La captura ya estaba tomada o no es compatible: se ignora.
    }
  }

  /** Guarda la posición en pantalla de cada puntero activo. */
  function registrarPuntero(evento: Konva.KonvaEventObject<PointerEvent>): void {
    const caja = etapaRef.current?.container().getBoundingClientRect();
    if (!caja) return;
    punterosRef.current.set(evento.evt.pointerId, {
      x: evento.evt.clientX - caja.left,
      y: evento.evt.clientY - caja.top,
    });
  }

  function quitarPuntero(evento: Konva.KonvaEventObject<PointerEvent>): void {
    punterosRef.current.delete(evento.evt.pointerId);
  }

  /** Distancia y centro entre los dos primeros dedos apoyados. */
  function medirPinza(): { distancia: number; centro: { x: number; y: number } } | null {
    const puntos = [...punterosRef.current.values()];
    if (puntos.length < 2) return null;
    const [a, b] = puntos;
    return {
      distancia: Math.hypot(b.x - a.x, b.y - a.y),
      centro: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
    };
  }

  /** Al apoyar el segundo dedo se cancela el gesto de uno y empieza la pinza. */
  function iniciarPinza(): void {
    usuarioAjustoVistaRef.current = true;
    terminarPan();
    panPantallaInicioRef.current = null;
    interaccionRef.current = null;
    inicioRef.current = null;
    clicPresetRef.current = null;
    setRectPreview(null);
    pinzaRef.current = medirPinza();
  }

  /** Dos dedos: acerca o aleja (distancia) y desplaza la vista (centro). */
  function aplicarPinza(): void {
    const anterior = pinzaRef.current;
    const actual = medirPinza();
    if (!anterior || !actual) return;
    if (anterior.distancia > 8 && actual.distancia > 8) {
      aplicarZoomEnPunto(actual.distancia / anterior.distancia, actual.centro);
    }
    desplazarVista(actual.centro.x - anterior.centro.x, actual.centro.y - anterior.centro.y);
    pinzaRef.current = actual;
  }

  function liberarPuntero(evento: Konva.KonvaEventObject<PointerEvent>): void {
    try {
      const contenido = etapaRef.current?.getContent();
      const idPuntero = evento.evt.pointerId;
      if (contenido?.hasPointerCapture(idPuntero)) {
        contenido.releasePointerCapture(idPuntero);
      }
    } catch {
      // Sin captura activa: se ignora.
    }
  }

  function crearInteraccionMover(
    idPieza: string,
    ids: string[],
    punto: { x: number; y: number },
    pantalla: { x: number; y: number },
  ): InteraccionMover | null {
    const pieza = piezas.find((p) => p.id === idPieza);
    if (!pieza) return null;
    const origenPiezas: Record<string, { x: number; y: number }> = {};
    for (const id of ids) {
      const p = piezas.find((q) => q.id === id);
      if (p) origenPiezas[id] = { x: p.x, y: p.y };
    }
    return {
      tipo: 'mover',
      idPieza,
      ids,
      x0: pieza.x,
      y0: pieza.y,
      desplazamientoX: pieza.x * PX_POR_CM - punto.x,
      desplazamientoY: pieza.y * PX_POR_CM - punto.y,
      origenPiezas,
      pantalla0: pantalla,
      movido: false,
    };
  }

  function alPresionarRaton(evento: Konva.KonvaEventObject<PointerEvent>): void {
    capturarPuntero(evento);
    registrarPuntero(evento);

    // Dos dedos: pinza para acercar/alejar y desplazar a la vez.
    if (punterosRef.current.size >= 2) {
      iniciarPinza();
      return;
    }

    const punto = puntoRelativo(evento);
    if (!punto) return;
    const pantalla = puntoPantalla(evento);

    // Herramienta de desplazar plano: arrastrar mueve la vista (no selecciona).
    // Se usa la posición de pantalla para que el plano siga al cursor 1:1.
    if (herramienta === 'mano') {
      if (pantalla) {
        iniciarPaneo(pantalla);
      }
      return;
    }

    // Al pulsar sobre una pieza, sea cual sea la herramienta activa, se pasa
    // automáticamente a seleccionar (salvo con la mano, que desplaza el plano).
    const objetivo = detectarObjetivo(punto);
    const idPieza = objetivo?.idPieza ?? null;
    if (herramienta !== 'seleccion' && idPieza) {
      const pieza = piezas.find((p) => p.id === idPieza);
      if (!pieza || !pantalla) return;
      setHerramienta('seleccion');
      setIdsSeleccionadas([]);
      const movimiento = crearInteraccionMover(idPieza, [idPieza], punto, pantalla);
      if (!movimiento) return;
      interaccionRef.current = movimiento;
      onSeleccionarPieza(idPieza);
      return;
    }

    if (herramienta === 'seleccion') {
      const esquina = objetivo?.esquina;
      const abrirMedidor = objetivo?.abrirMedidor === true;

      if (idPieza && abrirMedidor) {
        onSeleccionarPieza(idPieza);
        return;
      }

      if (idPieza && esquina) {
        const pieza = piezas.find((p) => p.id === idPieza);
        if (!pieza) return;
        interaccionRef.current = {
          tipo: 'redimensionar',
          idPieza,
          esquina,
          x: pieza.x,
          y: pieza.y,
          ancho0: pieza.anchoCm,
          alto0: pieza.altoCm,
          pantalla0: pantalla ?? { x: 0, y: 0 },
          movido: false,
        };
        onSeleccionarPieza(idPieza);
      } else if (idPieza) {
        const pieza = piezas.find((p) => p.id === idPieza);
        if (!pieza || !pantalla) return;
        if (idsSeleccionadas.length > 0 && idsSeleccionadas.includes(idPieza)) {
          const movimiento = crearInteraccionMover(idPieza, idsSeleccionadas, punto, pantalla);
          if (!movimiento) return;
          interaccionRef.current = movimiento;
          onSeleccionarPieza(idPieza);
          return;
        }
        const movimiento = crearInteraccionMover(idPieza, [idPieza], punto, pantalla);
        if (!movimiento) return;
        interaccionRef.current = movimiento;
        onSeleccionarPieza(idPieza);
        setIdsSeleccionadas([]);
      } else {
        // El rectángulo de selección múltiple se dibuja siempre sobre el vacío.
        inicioRef.current = { x: punto.x, y: punto.y };
        setRectPreview({ x: punto.x, y: punto.y, ancho: 0, alto: 0 });
      }
      return;
    }

    // Las plantillas no se dimensionan arrastrando: un clic abre el diálogo
    // con las medidas reales de la ventana (o del hueco si el plano lo tiene).
    if (herramienta.startsWith('preset-')) {
      const puntoDentro = limitarPunto(punto);
      clicPresetRef.current = {
        x: Math.round(puntoDentro.x / PX_POR_CM),
        y: Math.round(puntoDentro.y / PX_POR_CM),
      };
      return;
    }

    const puntoDentro = limitarPunto(punto);
    const x = redondearAPx(puntoDentro.x, PX_POR_CM);
    const y = redondearAPx(puntoDentro.y, PX_POR_CM);
    inicioRef.current = { x, y };
    setRectPreview({ x, y, ancho: 0, alto: 0 });
  }

  function alMoverRaton(evento: Konva.KonvaEventObject<PointerEvent>): void {
    registrarPuntero(evento);
    if (pinzaRef.current && punterosRef.current.size >= 2) {
      aplicarPinza();
      return;
    }

    const pantalla = puntoPantalla(evento);
    if (pantalla && aplicarPan(pantalla)) return;

    const punto = puntoRelativo(evento);
    if (!punto) return;

    if (rectPreview && inicioRef.current) {
      const origen = inicioRef.current;
      const candidato: RectanguloNuevo = {
        x: Math.min(origen.x, punto.x),
        y: Math.min(origen.y, punto.y),
        ancho: Math.abs(redondearAPx(punto.x, PX_POR_CM) - origen.x),
        alto: Math.abs(redondearAPx(punto.y, PX_POR_CM) - origen.y),
      };
      // Fuera del hueco el rectángulo queda vacío: se conserva el último
      // válido en vez de cancelar el gesto (el trazo puede volver al vano).
      const limitado = limitarRect(candidato);
      if (limitado) {
        setRectPreview(limitado);
      }
      return;
    }

    const interaccion = interaccionRef.current;
    if (!interaccion) return;

    // Un toque sin arrastre no mueve nada: hace falta superar el umbral.
    if (!interaccion.movido) {
      if (!pantalla) return;
      const recorrido = Math.hypot(
        pantalla.x - interaccion.pantalla0.x,
        pantalla.y - interaccion.pantalla0.y,
      );
      if (recorrido < UMBRAL_ARRASTRE) return;
      interaccion.movido = true;
    }

    if (interaccion.tipo === 'mover') {
      // Arrastre exacto 1:1 con el cursor. Cada pieza se posiciona desde su
      // posición ORIGINAL del gesto + el delta total actual, jamás desde la
      // posición ya desplazada del prop: si un render queda pendiente, el
      // delta total no se vuelve a sumar encima (sin arrastre compuesto).
      const dx = Math.max(0, punto.x + interaccion.desplazamientoX) / PX_POR_CM - interaccion.x0;
      const dy = Math.max(0, punto.y + interaccion.desplazamientoY) / PX_POR_CM - interaccion.y0;
      onCambiarPiezas(
        piezas.map((p) => {
          if (!interaccion.ids.includes(p.id)) return p;
          const origen = interaccion.origenPiezas[p.id] ?? { x: p.x, y: p.y };
          const posicion = limitarPosicionPieza(
            redondearCm(Math.max(0, origen.x + dx)),
            redondearCm(Math.max(0, origen.y + dy)),
            p,
          );
          return { ...p, ...posicion };
        }),
      );
      return;
    }

    const base = interaccion;
    const xPx = punto.x;
    const yPx = punto.y;
    const x0 = base.x * PX_POR_CM;
    const y0 = base.y * PX_POR_CM;
    const anchoPx = base.ancho0 * PX_POR_CM;
    const altoPx = base.alto0 * PX_POR_CM;

    let nuevoAncho = base.ancho0;
    let nuevoAlto = base.alto0;
    let nuevoX = base.x;
    let nuevoY = base.y;

    const izquierda = base.esquina.includes('izq');
    const derecha = base.esquina.includes('der');
    const superior = base.esquina.includes('sup');
    const inferior = base.esquina.includes('inf');

    const cambiaAncho = izquierda || derecha;
    const cambiaAlto = superior || inferior;

    // Al tirar de un asa se ancla el borde opuesto: por eso al redimensionar
    // desde la izquierda o arriba se recalcula también la posición.
    if (cambiaAncho) {
      if (izquierda) {
        nuevoAncho = Math.max(2, anchoPx + x0 - xPx) / PX_POR_CM;
        nuevoX = x0 + (anchoPx - nuevoAncho * PX_POR_CM) / PX_POR_CM;
      } else {
        nuevoAncho = Math.max(2, xPx - x0) / PX_POR_CM;
      }
    }
    if (cambiaAlto) {
      if (superior) {
        nuevoAlto = Math.max(2, altoPx + y0 - yPx) / PX_POR_CM;
        nuevoY = y0 + (altoPx - nuevoAlto * PX_POR_CM) / PX_POR_CM;
      } else {
        nuevoAlto = Math.max(2, yPx - y0) / PX_POR_CM;
      }
    }

    // Con hueco, el redimensionado no puede salirse del vano.
    if (limitesHueco) {
      if (nuevoX < 0) {
        nuevoAncho += nuevoX;
        nuevoX = 0;
      }
      if (nuevoY < 0) {
        nuevoAlto += nuevoY;
        nuevoY = 0;
      }
      if (nuevoX + nuevoAncho > limitesHueco.ancho) {
        nuevoAncho = limitesHueco.ancho - nuevoX;
      }
      if (nuevoY + nuevoAlto > limitesHueco.alto) {
        nuevoAlto = limitesHueco.alto - nuevoY;
      }
      nuevoAncho = Math.max(0.2, nuevoAncho);
      nuevoAlto = Math.max(0.2, nuevoAlto);
    }

    onCambiarPiezas(
      piezas.map((p) => {
        if (p.id !== base.idPieza) return p;
        const ancho = Math.max(0.2, Math.round(nuevoAncho * 10) / 10);
        const alto = Math.max(0.2, Math.round(nuevoAlto * 10) / 10);
        const esLamina = p.tipo === 'vidrio' || p.tipo === 'acrilico';
        const esPunto = p.orientacion === 'punto';
        return {
          ...p,
          x: Math.max(0, Math.round(nuevoX * 10) / 10),
          y: Math.max(0, Math.round(nuevoY * 10) / 10),
          anchoCm: ancho,
          altoCm: alto,
          // En perfiles el largo de corte sigue al eje redimensionado, para que
          // el despiece (metros lineales) no quede desincronizado del dibujo.
          largoCm: esLamina || esPunto ? p.largoCm : p.orientacion === 'horizontal' ? ancho : alto,
        };
      }),
    );
  }

  async function alSoltarRaton(evento: Konva.KonvaEventObject<PointerEvent>): Promise<void> {
    liberarPuntero(evento);
    quitarPuntero(evento);
    if (punterosRef.current.size < 2) {
      pinzaRef.current = null;
    }

    if (terminarPan()) {
      const inicioPan = panPantallaInicioRef.current;
      const fin = puntoPantalla(evento);
      panPantallaInicioRef.current = null;
      // Un toque sin arrastre sobre el plano vacío quita la selección.
      if (
        inicioPan &&
        fin &&
        Math.hypot(fin.x - inicioPan.x, fin.y - inicioPan.y) < UMBRAL_ARRASTRE
      ) {
        onSeleccionarPieza(null);
        setIdsSeleccionadas([]);
      }
      return;
    }
    panPantallaInicioRef.current = null;

    const interaccion = interaccionRef.current;
    const huboMovimiento = interaccion?.movido === true;

    if (herramienta.startsWith('preset-')) {
      const punto = clicPresetRef.current;
      clicPresetRef.current = null;
      if (!punto) return;
      const modeloId = herramienta.slice('preset-'.length);
      const modelo = modelos.find((item) => item.id === modeloId);
      setAnchoPreset(
        limitesHueco ? String(limitesHueco.ancho) : modelo ? String(modelo.ejemplo.ancho) : '120',
      );
      setAltoPreset(
        limitesHueco ? String(limitesHueco.alto) : modelo ? String(modelo.ejemplo.alto) : '120',
      );
      setPresetPendiente({ modeloId, xCm: punto.x, yCm: punto.y });
      return;
    }

    if (rectPreview && inicioRef.current) {
      const rect = rectPreview;
      setRectPreview(null);
      inicioRef.current = null;
      if (rect.ancho < PX_POR_CM || rect.alto < PX_POR_CM) {
        onSeleccionarPieza(null);
        setIdsSeleccionadas([]);
        return;
      }

      if (herramienta === 'seleccion') {
        const dentro: string[] = [];
        piezas.forEach((pieza) => {
          const xPx = pieza.x * PX_POR_CM;
          const yPx = pieza.y * PX_POR_CM;
          const anchoPx = pieza.anchoCm * PX_POR_CM;
          const altoPx = pieza.altoCm * PX_POR_CM;
          const intersecta =
            xPx < rect.x + rect.ancho &&
            xPx + anchoPx > rect.x &&
            yPx < rect.y + rect.alto &&
            yPx + altoPx > rect.y;
          if (intersecta) dentro.push(pieza.id);
        });
        if (dentro.length > 0) {
          setIdsSeleccionadas(dentro);
          onSeleccionarPieza(null);
        } else {
          setIdsSeleccionadas([]);
          onSeleccionarPieza(null);
        }
        return;
      }

      if (herramienta.startsWith('custom-')) {
        const personalizada = piezasPersonalizadas.find(
          (item) => `custom-${item._id}` === herramienta,
        );
        if (!personalizada) return;
        const esPunto = personalizada.tipo === 'herraje';
        const esHorizontal = rect.ancho >= rect.alto;
        const largo = Math.max(rect.ancho, rect.alto) / PX_POR_CM;
        const grosor = Math.max(0.5, Math.min(rect.ancho, rect.alto) / PX_POR_CM);
        const pieza: PiezaPlano = {
          id: `pieza-${Date.now()}`,
          tipo: personalizada.tipo,
          ref: personalizada.ref,
          descripcion: personalizada.nombre,
          x: rect.x / PX_POR_CM,
          y: rect.y / PX_POR_CM,
          largoCm: esPunto ? 0 : largo,
          anchoCm: esPunto ? 3 : esHorizontal ? largo : grosor,
          altoCm: esPunto ? 3 : esHorizontal ? grosor : largo,
          orientacion: esPunto ? 'punto' : esHorizontal ? 'horizontal' : 'vertical',
          espesorMm: personalizada.espesorMm ?? 4,
          cantidad: 1,
          forma: personalizada.forma,
        };
        if (personalizada.tipo === 'vidrio' || personalizada.tipo === 'acrilico') {
          pieza.anchoCm = rect.ancho / PX_POR_CM;
          pieza.altoCm = rect.alto / PX_POR_CM;
        }
        await onPiezaDibujada(pieza);
        return;
      }

      const cad = herramienta as HerramientaCad;
      const categoria = categoriaDeHerramienta(cad);
      const esPunto = categoria === 'rodachina' || categoria === 'manija';
      const esHorizontal = rect.ancho >= rect.alto;
      const largo = Math.max(rect.ancho, rect.alto) / PX_POR_CM;
      const grosor = Math.max(0.5, Math.min(rect.ancho, rect.alto) / PX_POR_CM);

      const pieza: PiezaPlano = {
        id: `pieza-${Date.now()}`,
        tipo: esPunto ? categoria : 'perfil',
        ref: '',
        descripcion: '',
        x: rect.x / PX_POR_CM,
        y: rect.y / PX_POR_CM,
        largoCm: esPunto || categoria === 'vidrio' ? 0 : largo,
        anchoCm: esPunto ? 3 : esHorizontal ? largo : grosor,
        altoCm: esPunto ? 3 : esHorizontal ? grosor : largo,
        orientacion: esPunto ? 'punto' : esHorizontal ? 'horizontal' : 'vertical',
        espesorMm: categoria === 'vidrio' ? 4 : 1,
        cantidad: 1,
      };
      if (categoria === 'vidrio') {
        pieza.anchoCm = rect.ancho / PX_POR_CM;
        pieza.altoCm = rect.alto / PX_POR_CM;
        pieza.tipo = 'vidrio';
      }

      const sugerencias = perfiles.filter((perfil) => perfil.categoria === categoria);
      if (sugerencias.length === 0) {
        await onPiezaDibujada(pieza);
      } else if (sugerencias.length === 1) {
        const perfil = sugerencias[0];
        await onPiezaDibujada({ ...pieza, ref: perfil.ref, descripcion: perfil.descripcion });
      } else {
        setPiezaPendiente({ pieza, categoria });
        setTerminoBusqueda('');
      }
      return;
    }

    interaccionRef.current = null;
    if (huboMovimiento) {
      onGuardarCambios();
    }
  }

  async function confirmarPieza(ref: string, descripcion: string): Promise<void> {
    if (!piezaPendiente) return;
    await onPiezaDibujada({ ...piezaPendiente.pieza, ref, descripcion });
    setPiezaPendiente(null);
  }

  async function confirmarPreset(): Promise<void> {
    if (!presetPendiente) return;
    const ancho = Number(anchoPreset.replace(',', '.'));
    const alto = Number(altoPreset.replace(',', '.'));
    if (!Number.isFinite(ancho) || !Number.isFinite(alto) || ancho < 10 || alto < 10) {
      return;
    }
    setInsertandoPreset(true);
    try {
      await onPresetDibujado(
        presetPendiente.modeloId,
        presetPendiente.xCm,
        presetPendiente.yCm,
        ancho,
        alto,
      );
    } finally {
      setInsertandoPreset(false);
      setPresetPendiente(null);
    }
  }


  return (
    <div className="lienzo-contenedor">
      {!modoVista && (
        <BarraHerramientas
          herramienta={herramienta}
          barraExpandida={barraExpandida}
          presetsAbierto={presetsAbierto}
          piezasAbierto={piezasAbierto}
          ayudaAbierta={ayudaAbierta}
          modelos={modelos}
          piezasPersonalizadas={piezasPersonalizadas}
          onCambiarHerramienta={setHerramienta}
          onAlternarBarra={() => setBarraExpandida((antes) => !antes)}
          onAlternarPresets={() => {
            setPresetsAbierto((antes) => !antes);
            setBarraExpandida(true);
          }}
          onAlternarPiezas={() => {
            setPiezasAbierto((antes) => !antes);
            setBarraExpandida(true);
          }}
          onAlternarAyuda={() => setAyudaAbierta((abierta) => !abierta)}
        />
      )}

      <div
        className="lienzo-scroll"
        ref={contenedorRef}
        data-tour="editor-lienzo"
        data-vista={JSON.stringify(vista)}
        data-rect={JSON.stringify(rectPreview)}
      >
        <ControlesZoom
          aplicarZoom={ajustarZoomVista}
          enPantallaCompleta={enPantallaCompleta}
          onAbrirPantallaCompleta={onAbrirPantallaCompleta}
          onEncuadrar={encuadrarVista}
        />
        <Stage
          ref={etapaRef}
          width={tamanoVista.ancho}
          height={tamanoVista.alto}
          onWheel={rodarZoom}
          onPointerDown={alPresionarRaton}
          onPointerMove={alMoverRaton}
          onPointerUp={alSoltarRaton}
          onPointerLeave={alSoltarRaton}
        >
          <Layer>
            <Group
              ref={mundoRef}
              x={vista.x}
              y={vista.y}
              scaleX={vista.zoom}
              scaleY={vista.zoom}
            >
              <RejillaKonva
                rangoMundo={rangoMundo}
                lineasRejilla={lineasRejilla}
                colorFondo={colorFondo}
                colorRejillaFina={colorRejillaFina}
                colorRejillaFuerte={colorRejillaFuerte}
                colorEtiqueta={colorEtiqueta}
              />

              {hueco && hueco.anchoCm > 0 && hueco.altoCm > 0 && (
                <HuecoKonva
                  anchoCm={hueco.anchoCm}
                  altoCm={hueco.altoCm}
                  colorEtiqueta={colorEtiqueta}
                  colorFondo={colorFondo}
                />
              )}

              <PiezasKonva
                piezas={piezasDibujo}
                perfiles={perfiles}
                paleta={paleta}
                piezaSeleccionadaId={piezaSeleccionadaId}
                idsSeleccionadas={idsSeleccionadas}
                rectPreview={rectPreview}
                herramienta={herramienta}
                colorAcento={colorAcento}
              />

              {piezaSeleccionada && herramienta === 'seleccion' && idsSeleccionadas.length === 0 && (
                <AsasSeleccion
                  pieza={piezaSeleccionada}
                  zoom={vista.zoom}
                  colorAcento={colorAcento}
                  colorBorde={colorBorde}
                  colorTexto={colorTexto}
                />
              )}

              {piezaSeleccionada && herramienta === 'seleccion' && idsSeleccionadas.length === 0 && (
                <CotasKonva
                  pieza={piezaSeleccionada}
                  colorCota={colorTexto}
                  colorFondo={colorFondo}
                />
              )}
            </Group>
          </Layer>

          {!modoVista && (
            <Layer listening={false}>
              <ReglasLienzo
                vista={vista}
                tamanoVista={tamanoVista}
                colorFondo={colorFondo}
                colorMarca={colorBorde}
                colorEtiqueta={colorEtiqueta}
                colorOrigen={colorTexto}
              />
            </Layer>
          )}
        </Stage>

        {((!modoVista && ayudaAbierta) || (mostrarMedidor && piezaSeleccionada)) && (
          <div className="panel-flotante-lienzo">
            {!modoVista && (
              <AyudaLienzo abierta={ayudaAbierta} onCerrar={() => setAyudaAbierta(false)} />
            )}

            {mostrarMedidor && piezaSeleccionada && (
              <MedidorPieza
                pieza={piezaSeleccionada}
                perfiles={perfiles}
                onSeleccionarPieza={onSeleccionarPieza}
                onMedir={(cambios) => {
                  onCambiarPiezas(
                    piezas.map((p) => (p.id === piezaSeleccionada.id ? { ...p, ...cambios } : p)),
                  );
                  onGuardarCambios();
                }}
                onCerrar={() => onSeleccionarPieza(null)}
              />
            )}
          </div>
        )}

        {!modoVista && estadoGuardado && onGuardar && (
          <div className="guardado-overlay">
            <button
              type="button"
              className={`boton-guardar estado-guardado estado-${estadoGuardado}`}
              disabled={estadoGuardado === 'sincronizado' || estadoGuardado === 'guardando'}
              onClick={onGuardar}
              title="Guardar los cambios en el servidor"
            >
              {TEXTO_ESTADO_GUARDADO[estadoGuardado]}
            </button>
          </div>
        )}
      </div>

      {piezaPendiente && (
        <SelectorRef
          categoria={piezaPendiente.categoria}
          terminoBusqueda={terminoBusqueda}
          resultados={resultados}
          onBuscar={setTerminoBusqueda}
          onCancelar={() => setPiezaPendiente(null)}
          onElegir={(ref, descripcion) => void confirmarPieza(ref, descripcion)}
        />
      )}

      {presetPendiente && (
        <DialogoPreset
          modelo={modelos.find((item) => item.id === presetPendiente.modeloId)}
          anchoPreset={anchoPreset}
          altoPreset={altoPreset}
          insertando={insertandoPreset}
          onCambiarAncho={setAnchoPreset}
          onCambiarAlto={setAltoPreset}
          onCancelar={() => setPresetPendiente(null)}
          onConfirmar={() => void confirmarPreset()}
        />
      )}
    </div>
  );
}
