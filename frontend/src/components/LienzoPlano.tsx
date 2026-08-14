import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import { useZoomPan } from '../hooks/useZoomPan';
import type { ModeloVentaneria, PerfilCategoria, PerfilVentaneria, PiezaPlano } from '../tipos';
import type { HerramientaCad } from '../constantes';
import type { EstadoGuardado, Interaccion, InteraccionMover, RectanguloNuevo } from '../tipos/lienzo';
import { MINIMO_SELECCION_PANTALLA, PX_POR_CM, TAMANO_ASA } from '../constantes';
import { obtenerColorVar } from '../utils/colores';
import { redondearAPx, redondearCm } from '../utils/geometria';
import { categoriaDeHerramienta } from '../tipos/lienzo';
import { useRejilla } from '../hooks/useRejilla';
import BarraHerramientas from '../componentes/lienzo/BarraHerramientas';
import ControlesZoom from '../componentes/lienzo/ControlesZoom';
import RejillaKonva from '../componentes/lienzo/RejillaKonva';
import PiezasKonva from '../componentes/lienzo/PiezasKonva';
import AsasSeleccion, { ESQUINAS_ASAS } from '../componentes/lienzo/AsasSeleccion';
import CotasKonva from '../componentes/lienzo/CotasKonva';
import MedidorPieza from '../componentes/lienzo/MedidorPieza';
import AyudaLienzo from '../componentes/lienzo/AyudaLienzo';
import SelectorRef from '../componentes/lienzo/SelectorRef';
import DialogoPreset from '../componentes/lienzo/DialogoPreset';

interface LienzoPlanoProps {
  piezas: PiezaPlano[];
  modelos: ModeloVentaneria[];
  perfiles: PerfilVentaneria[];
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

export default function LienzoPlano({
  piezas,
  modelos,
  perfiles,
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
  const [medidorAbierto, setMedidorAbierto] = useState(false);
  const [idsSeleccionadas, setIdsSeleccionadas] = useState<string[]>([]);

  const {
    vista,
    tamanoVista,
    etapaRef,
    contenedorRef,
    aplicarZoom,
    acercarAlejar,
    iniciarPan,
    aplicarPan,
    terminarPan,
  } = useZoomPan();
  const mundoRef = useRef<Konva.Group>(null);
  const inicioRef = useRef<{ x: number; y: number } | null>(null);
  const interaccionRef = useRef<Interaccion | null>(null);
  const clicPresetRef = useRef<{ x: number; y: number } | null>(null);

  const colorFondo = obtenerColorVar('--bg-secondary', '#ebebef');
  const colorRelleno = obtenerColorVar('--bg-tertiary', '#dddde3');
  const colorBorde = obtenerColorVar('--border-strong', '#aeaeb2');
  const colorTexto = obtenerColorVar('--text-primary', '#1c1c1e');
  const colorAcento = '#2e7d32';
  const colorVidrio = 'rgba(78, 165, 217, 0.30)';
  const colorRejillaFina = obtenerColorVar('--linea-fina', 'rgba(0,0,0,0.06)');
  const colorRejillaFuerte = obtenerColorVar('--linea-fuerte', 'rgba(0,0,0,0.12)');
  const colorEtiqueta = obtenerColorVar('--text-tertiary', '#86878c');

  const { rangoMundo, lineasRejilla } = useRejilla(piezas, vista, tamanoVista);

  const piezaSeleccionada = piezas.find((p) => p.id === piezaSeleccionadaId) ?? null;

  useEffect(() => {
    // En modo de solo vista la única herramienta disponible es la mano.
    if (modoVista) {
      setHerramienta('mano');
    }
  }, [modoVista]);

  useEffect(() => {
    const idsValidos = new Set(piezas.map((p) => p.id));
    setIdsSeleccionadas((anterior) => anterior.filter((id) => idsValidos.has(id)));
  }, [piezas]);

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

  function puntoRelativo(): { x: number; y: number } | null {
    return mundoRef.current?.getRelativePointerPosition() ?? null;
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
    for (let i = piezas.length - 1; i >= 0; i--) {
      const pieza = piezas[i];
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
  function capturarPuntero(evento: Konva.KonvaEventObject<MouseEvent>): void {
    try {
      const idPuntero = (evento.evt as PointerEvent).pointerId;
      etapaRef.current?.getContent().setPointerCapture(idPuntero);
    } catch {
      // La captura ya estaba tomada o no es compatible: se ignora.
    }
  }

  function liberarPuntero(evento: Konva.KonvaEventObject<MouseEvent>): void {
    try {
      const contenido = etapaRef.current?.getContent();
      const idPuntero = (evento.evt as PointerEvent).pointerId;
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
    };
  }

  function alPresionarRaton(evento: Konva.KonvaEventObject<MouseEvent>): void {
    capturarPuntero(evento);
    const punto = puntoRelativo();
    if (!punto) return;

    // Herramienta de desplazar plano: arrastrar mueve la vista (no selecciona).
    if (herramienta === 'mano') {
      iniciarPan(punto);
      return;
    }

    // Al pulsar sobre una pieza, sea cual sea la herramienta activa, se pasa
    // automáticamente a seleccionar (salvo con la mano, que desplaza el plano).
    const objetivo = detectarObjetivo(punto);
    const idPieza = objetivo?.idPieza ?? null;
    if (herramienta !== 'seleccion' && idPieza) {
      const pieza = piezas.find((p) => p.id === idPieza);
      if (!pieza) return;
      setHerramienta('seleccion');
      setMedidorAbierto(false);
      setIdsSeleccionadas([]);
      const movimiento = crearInteraccionMover(idPieza, [idPieza], punto);
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
        setMedidorAbierto(true);
        return;
      }

      if (idPieza && esquina) {
        const pieza = piezas.find((p) => p.id === idPieza);
        if (!pieza) return;
        setMedidorAbierto(false);
        interaccionRef.current = {
          tipo: 'redimensionar',
          idPieza,
          esquina,
          x: pieza.x,
          y: pieza.y,
          ancho0: pieza.anchoCm,
          alto0: pieza.altoCm,
        };
        onSeleccionarPieza(idPieza);
      } else if (idPieza) {
        const pieza = piezas.find((p) => p.id === idPieza);
        if (!pieza) return;
        if (idsSeleccionadas.length > 0 && idsSeleccionadas.includes(idPieza)) {
          setMedidorAbierto(false);
          const movimiento = crearInteraccionMover(idPieza, idsSeleccionadas, punto);
          if (!movimiento) return;
          interaccionRef.current = movimiento;
          onSeleccionarPieza(idPieza);
          return;
        }
        const movimiento = crearInteraccionMover(idPieza, [idPieza], punto);
        if (!movimiento) return;
        interaccionRef.current = movimiento;
        onSeleccionarPieza(idPieza);
        setIdsSeleccionadas([]);
        setMedidorAbierto(false);
      } else {
        setMedidorAbierto(false);
        inicioRef.current = { x: punto.x, y: punto.y };
        setRectPreview({ x: punto.x, y: punto.y, ancho: 0, alto: 0 });
      }
      return;
    }

    // Las plantillas no se dimensionan arrastrando: un clic abre el diálogo
    // con las medidas reales de la ventana.
    if (herramienta.startsWith('preset-')) {
      clicPresetRef.current = {
        x: Math.round(punto.x / PX_POR_CM),
        y: Math.round(punto.y / PX_POR_CM),
      };
      return;
    }

    const x = redondearAPx(punto.x, PX_POR_CM);
    const y = redondearAPx(punto.y, PX_POR_CM);
    inicioRef.current = { x, y };
    setRectPreview({ x, y, ancho: 0, alto: 0 });
  }

  function alMoverRaton(): void {
    const punto = puntoRelativo();
    if (!punto) return;

    if (aplicarPan(punto)) return;

    if (rectPreview && inicioRef.current) {
      const origen = inicioRef.current;
      setRectPreview({
        x: Math.min(origen.x, punto.x),
        y: Math.min(origen.y, punto.y),
        ancho: Math.abs(redondearAPx(punto.x, PX_POR_CM) - origen.x),
        alto: Math.abs(redondearAPx(punto.y, PX_POR_CM) - origen.y),
      });
      return;
    }

    const interaccion = interaccionRef.current;
    if (!interaccion) return;

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
          return {
            ...p,
            x: redondearCm(Math.max(0, origen.x + dx)),
            y: redondearCm(Math.max(0, origen.y + dy)),
          };
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

    onCambiarPiezas(
      piezas.map((p) =>
        p.id === base.idPieza
          ? {
              ...p,
              x: Math.max(0, Math.round(nuevoX * 10) / 10),
              y: Math.max(0, Math.round(nuevoY * 10) / 10),
              anchoCm: Math.max(0.2, Math.round(nuevoAncho * 10) / 10),
              altoCm: Math.max(0.2, Math.round(nuevoAlto * 10) / 10),
            }
          : p,
      ),
    );
  }

  async function alSoltarRaton(evento: Konva.KonvaEventObject<MouseEvent>): Promise<void> {
    liberarPuntero(evento);
    if (terminarPan()) return;

    const habiaInteraccion = interaccionRef.current !== null;

    if (herramienta.startsWith('preset-')) {
      const punto = clicPresetRef.current;
      clicPresetRef.current = null;
      if (!punto) return;
      const modeloId = herramienta.slice('preset-'.length);
      const modelo = modelos.find((item) => item.id === modeloId);
      setAnchoPreset(modelo ? String(modelo.ejemplo.ancho) : '120');
      setAltoPreset(modelo ? String(modelo.ejemplo.alto) : '120');
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
        setMedidorAbierto(false);
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
        setMedidorAbierto(false);
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
    if (habiaInteraccion) {
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
          modelos={modelos}
          onCambiarHerramienta={setHerramienta}
          onAlternarBarra={() => setBarraExpandida((antes) => !antes)}
          onAlternarPresets={() => {
            setPresetsAbierto((antes) => !antes);
            setBarraExpandida(true);
          }}
        />
      )}

      <div className="lienzo-scroll" ref={contenedorRef}>
        {!modoVista && (
          <ControlesZoom
            aplicarZoom={aplicarZoom}
            enPantallaCompleta={enPantallaCompleta}
            onAbrirPantallaCompleta={onAbrirPantallaCompleta}
          />
        )}
        <Stage
          ref={etapaRef}
          width={tamanoVista.ancho}
          height={tamanoVista.alto}
          onWheel={acercarAlejar}
          onMouseDown={alPresionarRaton}
          onMouseMove={alMoverRaton}
          onMouseUp={alSoltarRaton}
          onMouseLeave={alSoltarRaton}
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

              <PiezasKonva
                piezas={piezas}
                piezaSeleccionadaId={piezaSeleccionadaId}
                idsSeleccionadas={idsSeleccionadas}
                rectPreview={rectPreview}
                herramienta={herramienta}
                colorAcento={colorAcento}
                colorBorde={colorBorde}
                colorRelleno={colorRelleno}
                colorVidrio={colorVidrio}
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
        </Stage>

        {piezaSeleccionada && medidorAbierto && (
          <MedidorPieza
            pieza={piezaSeleccionada}
            vista={vista}
            onSeleccionarPieza={onSeleccionarPieza}
            onMedir={(cambios) => {
              onCambiarPiezas(
                piezas.map((p) => (p.id === piezaSeleccionada.id ? { ...p, ...cambios } : p)),
              );
              onGuardarCambios();
            }}
            onCerrar={() => setMedidorAbierto(false)}
          />
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

      {!modoVista && <AyudaLienzo />}

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
