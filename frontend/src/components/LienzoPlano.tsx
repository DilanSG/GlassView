import { useEffect, useMemo, useRef, useState } from 'react';
import { Group, Layer, Stage } from 'react-konva';
import type Konva from 'konva';
import { useZoomPan } from '../hooks/useZoomPan';
import { exportarPlanoPdf as exportarPlanoPdfDesdeModulo } from '../pdf/exportarPlanoPdf';
import type { ModeloVentaneria, PerfilCategoria, PerfilVentaneria, PiezaPlano } from '../tipos';
import type { HerramientaCad } from '../constantes';
import type { Interaccion, RectanguloNuevo } from '../tipos/lienzo';
import { PX_POR_CM } from '../constantes';
import { obtenerColorVar } from '../utils/colores';
import { redondearAPx } from '../utils/geometria';
import { categoriaDeHerramienta } from '../tipos/lienzo';
import { useRejilla } from '../hooks/useRejilla';
import BarraHerramientas from '../componentes/lienzo/BarraHerramientas';
import ControlesZoom from '../componentes/lienzo/ControlesZoom';
import RejillaKonva from '../componentes/lienzo/RejillaKonva';
import PiezasKonva from '../componentes/lienzo/PiezasKonva';
import AsasSeleccion from '../componentes/lienzo/AsasSeleccion';
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
  onCambiarPiezas: (piezas: PiezaPlano[]) => void;
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
  /** Nombre del proyecto, se usa como título y nombre de archivo del PDF. */
  nombrePlano?: string;
}

export default function LienzoPlano({
  piezas,
  modelos,
  perfiles,
  piezaSeleccionadaId,
  onSeleccionarPieza,
  onCambiarPiezas,
  onPiezaDibujada,
  onPresetDibujado,
  onAbrirPantallaCompleta,
  enPantallaCompleta = false,
  nombrePlano = 'plano',
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
      if (evento.key === 'Delete' || evento.key === 'Backspace') {
        const ids = new Set<string>([...idsSeleccionadas]);
        if (piezaSeleccionadaId) ids.add(piezaSeleccionadaId);
        if (ids.size > 0) {
          evento.preventDefault();
          onCambiarPiezas(piezas.filter((p) => !ids.has(p.id)));
          onSeleccionarPieza(null);
          setIdsSeleccionadas([]);
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

  function alPresionarRaton(): void {
    const punto = puntoRelativo();
    if (!punto) return;

    // Herramienta de desplazar plano: arrastrar mueve la vista (no selecciona).
    if (herramienta === 'mano') {
      iniciarPan(punto);
      return;
    }

    // Al pulsar sobre una pieza, sea cual sea la herramienta activa, se pasa
    // automáticamente a seleccionar (salvo con la mano, que desplaza el plano).
    const intersecciones = mundoRef.current?.getAllIntersections(punto) ?? [];
    const objetivo =
      intersecciones.find((obj) => obj.getAttr('data-esquina')) ??
      intersecciones.find((obj) => obj.getAttr('data-abrir-medidor')) ??
      intersecciones.find((obj) => obj.getAttr('data-id-pieza')) ??
      null;
    const idPieza = objetivo?.getAttr('data-id-pieza');
    if (herramienta !== 'seleccion' && idPieza) {
      const pieza = piezas.find((p) => p.id === idPieza);
      if (!pieza) return;
      setHerramienta('seleccion');
      setMedidorAbierto(false);
      setIdsSeleccionadas([]);
      interaccionRef.current = {
        tipo: 'mover',
        idPieza,
        ids: [idPieza],
        x0: pieza.x,
        y0: pieza.y,
        desplazamientoX: pieza.x * PX_POR_CM - punto.x,
        desplazamientoY: pieza.y * PX_POR_CM - punto.y,
      };
      onSeleccionarPieza(idPieza);
      return;
    }

    if (herramienta === 'seleccion') {
      const esquina = objetivo?.getAttr('data-esquina');
      const abrirMedidor = objetivo?.getAttr('data-abrir-medidor') === true;

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
          interaccionRef.current = {
            tipo: 'mover',
            idPieza,
            ids: idsSeleccionadas,
            x0: pieza.x,
            y0: pieza.y,
            desplazamientoX: pieza.x * PX_POR_CM - punto.x,
            desplazamientoY: pieza.y * PX_POR_CM - punto.y,
          };
          onSeleccionarPieza(idPieza);
          return;
        }
        interaccionRef.current = {
          tipo: 'mover',
          idPieza,
          ids: [idPieza],
          x0: pieza.x,
          y0: pieza.y,
          desplazamientoX: pieza.x * PX_POR_CM - punto.x,
          desplazamientoY: pieza.y * PX_POR_CM - punto.y,
        };
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
      const xPx = redondearAPx(punto.x + interaccion.desplazamientoX, PX_POR_CM);
      const yPx = redondearAPx(punto.y + interaccion.desplazamientoY, PX_POR_CM);
      const dx = Math.max(0, xPx) / PX_POR_CM - interaccion.x0;
      const dy = Math.max(0, yPx) / PX_POR_CM - interaccion.y0;
      onCambiarPiezas(
        piezas.map((p) =>
          interaccion.ids.includes(p.id)
            ? {
                ...p,
                x: Math.max(0, Math.round((p.x + dx) * 10) / 10),
                y: Math.max(0, Math.round((p.y + dy) * 10) / 10),
              }
            : p,
        ),
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

  async function alSoltarRaton(): Promise<void> {
    if (terminarPan()) return;

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


  /** Genera y descarga un PDF del plano con cotas en los cuatro lados. */
  function exportarPlanoPdf(): void {
    exportarPlanoPdfDesdeModulo(piezas, piezaSeleccionada, nombrePlano);
  }

  return (
    <div className="lienzo-contenedor">
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

      <div className="lienzo-scroll" ref={contenedorRef}>
        <ControlesZoom
          aplicarZoom={aplicarZoom}
          enPantallaCompleta={enPantallaCompleta}
          onAbrirPantallaCompleta={onAbrirPantallaCompleta}
          onExportarPdf={exportarPlanoPdf}
        />
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
            onMedir={(cambios) =>
              onCambiarPiezas(
                piezas.map((p) => (p.id === piezaSeleccionada.id ? { ...p, ...cambios } : p)),
              )
            }
            onCerrar={() => setMedidorAbierto(false)}
          />
        )}
      </div>

      <AyudaLienzo />

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
