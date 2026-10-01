import { useEffect, useRef, useState } from 'react';
import {
  calcularDespiecePiezas,
  generarPiezasPreset,
  listarPiezasPersonalizadas,
  obtenerCatalogoVentaneria,
  obtenerPerfilesVentaneria,
} from '../api/clienteApi';
import LienzoPlano from './LienzoPlano';
import IconoAccion from './IconoAccion';
import PanelPiezas from './PanelPiezas';
import PanelDespiece from '../componentes/despiece/PanelDespiece';
import AvisoOrientacion from '../componentes/lienzo/AvisoOrientacion';
import MiniaturaPlano from '../piezas/MiniaturaPlano';
import { exportarPlanoPdf } from '../pdf/exportarPlanoPdf';
import {
  activarPantallaCompletaHorizontal,
  desactivarPantallaCompletaHorizontal,
  elementoEnPantallaCompleta,
} from '../utils/pantallaCompleta';
import type {
  DespiecePiezas,
  ModeloVentaneria,
  PerfilVentaneria,
  PiezaPersonalizada,
  PiezaPlano,
  Proyecto,
} from '../tipos';
import type { EstadoGuardado } from '../tipos/lienzo';

interface DisenoProyectoProps {
  proyecto: Proyecto;
  onActualizarProyecto: (datos: Partial<Proyecto>) => Promise<Proyecto>;
  /** Vista con la que se abre el editor: 'vista' muestra solo el lienzo
   *  (sin herramientas ni paneles); 'edicion' muestra el editor completo. */
  modoInicial?: 'vista' | 'edicion';
}

type ModoEditor = 'vista' | 'edicion';

/**
 * Editor de diseño reutilizable: lienzo CAD con piezas individuales
 * y panel de despiece agrupado por REF.
 *
 * Las piezas viven en un estado local sincrónico (el lienzo responde al
 * instante) y se guardan en el servidor al terminar cada gesto, sin
 * temporizadores: si llegan cambios durante una petición en vuelo, al
 * terminar se envía automáticamente la última versión.
 */
export default function DisenoProyecto({
  proyecto,
  onActualizarProyecto,
  modoInicial = 'edicion',
}: DisenoProyectoProps) {
  const [modo, setModo] = useState<ModoEditor>(modoInicial);
  const [modelos, setModelos] = useState<ModeloVentaneria[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilVentaneria[]>([]);
  const [piezasPersonalizadas, setPiezasPersonalizadas] = useState<PiezaPersonalizada[]>([]);
  const [piezas, setPiezas] = useState<PiezaPlano[]>(proyecto.piezas);
  const [piezaSeleccionadaId, setPiezaSeleccionadaId] = useState<string | null>(null);
  const [despiece, setDespiece] = useState<DespiecePiezas | null>(null);
  const [errorDespiece, setErrorDespiece] = useState('');
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [panelesVisibles, setPanelesVisibles] = useState(false);
  const [vistaPanel, setVistaPanel] = useState<'piezas' | 'despiece'>('piezas');
  const [error, setError] = useState('');
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('sincronizado');
  const [versionDespiece, setVersionDespiece] = useState(0);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const piezasRef = useRef<PiezaPlano[]>(proyecto.piezas);
  const esSucioRef = useRef(false);
  const guardandoRef = useRef(false);
  const historialRef = useRef<PiezaPlano[][]>([]);
  const gestoHistorialRef = useRef(false);
  const [puedeDeshacer, setPuedeDeshacer] = useState(false);

  useEffect(() => {
    obtenerCatalogoVentaneria()
      .then(setModelos)
      .catch(() => {
        // El catálogo no es crítico para mostrar el proyecto.
      });
    obtenerPerfilesVentaneria()
      .then(setPerfiles)
      .catch(() => {
        // Los perfiles no son críticos para mostrar el proyecto.
      });
    listarPiezasPersonalizadas()
      .then(setPiezasPersonalizadas)
      .catch(() => {
        // La biblioteca de piezas propias tampoco es crítica al abrir el editor.
      });
  }, []);

  useEffect(() => {
    // La pantalla completa nativa puede salir con Esc: se sincroniza el estado.
    const alCambiar = (): void => setPantallaCompleta(elementoEnPantallaCompleta() !== null);
    document.addEventListener('fullscreenchange', alCambiar);
    document.addEventListener('webkitfullscreenchange', alCambiar);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiar);
      document.removeEventListener('webkitfullscreenchange', alCambiar);
    };
  }, []);

  /** Abre o cierra la pantalla completa nativa del editor. */
  async function alternarPantallaCompleta(): Promise<void> {
    if (elementoEnPantallaCompleta()) {
      await desactivarPantallaCompletaHorizontal();
    } else {
      // En móviles, la pantalla completa permite bloquear el horizontal.
      await activarPantallaCompletaHorizontal(contenedorRef.current);
    }
  }

  /**
   * Actualiza las piezas al instante (sin tocar el servidor). El historial se
   * llena una sola vez por gesto: el primer cambio guarda el estado previo y
   * los siguientes del mismo gesto (arrastre, tipeo) no lo repiten.
   */
  function cambiarPiezas(nuevas: PiezaPlano[]): void {
    if (!gestoHistorialRef.current) {
      historialRef.current.push(piezasRef.current);
      if (historialRef.current.length > 60) {
        historialRef.current.shift();
      }
      gestoHistorialRef.current = true;
      setPuedeDeshacer(true);
    }
    esSucioRef.current = true;
    piezasRef.current = nuevas;
    setPiezas(nuevas);
    setEstadoGuardado('conCambios');
  }

  /**
   * Guarda el estado actual en el servidor. Sin temporizadores: si mientras
   * una petición está en vuelo llegan más cambios, al terminar se reenvía la
   * última versión (coalescencia), evitando respuestas fuera de orden.
   */
  async function guardarPiezas(): Promise<void> {
    gestoHistorialRef.current = false;
    if (guardandoRef.current) {
      return;
    }
    guardandoRef.current = true;
    try {
      let enviadas: PiezaPlano[] | null = null;
      do {
        enviadas = piezasRef.current;
        setEstadoGuardado('guardando');
        await onActualizarProyecto({ piezas: enviadas });
      } while (piezasRef.current !== enviadas);

      esSucioRef.current = false;
      setError('');
      setEstadoGuardado('sincronizado');
      setVersionDespiece((version) => version + 1);
    } catch (causa) {
      setEstadoGuardado('error');
      setError(causa instanceof Error ? causa.message : 'Error al guardar las piezas.');
    } finally {
      guardandoRef.current = false;
    }
  }

  /** Devuelve el plano al estado anterior a la última edición. */
  function deshacer(): void {
    const anterior = historialRef.current.pop();
    if (!anterior) {
      return;
    }
    gestoHistorialRef.current = false;
    piezasRef.current = anterior;
    setPiezas(anterior);
    esSucioRef.current = true;
    setEstadoGuardado('conCambios');
    setPuedeDeshacer(historialRef.current.length > 0);
    void guardarPiezas();
  }

  useEffect(() => {
    historialRef.current = [];
    gestoHistorialRef.current = false;
    setPuedeDeshacer(false);
  }, [proyecto._id]);

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      if (modo === 'vista' || !(evento.ctrlKey || evento.metaKey)) return;
      if (evento.shiftKey || evento.altKey || evento.key.toLowerCase() !== 'z') return;
      const objetivo = evento.target as HTMLElement | null;
      if (
        objetivo &&
        (objetivo.tagName === 'INPUT' ||
          objetivo.tagName === 'TEXTAREA' ||
          objetivo.isContentEditable)
      ) {
        return;
      }
      evento.preventDefault();
      deshacer();
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modo]);

  useEffect(() => {
    // Si no hay ediciones pendientes, las piezas locales siguen al proyecto
    // (p. ej. al cargar o tras un guardado del servidor).
    if (!esSucioRef.current) {
      piezasRef.current = proyecto.piezas;
      setPiezas(proyecto.piezas);
    }
  }, [proyecto.piezas]);

  useEffect(() => {
    // El despiece se calcula también al abrir el proyecto, no solo tras guardar.
    setVersionDespiece((version) => version + 1);
  }, [proyecto._id]);

  const peticionDespieceRef = useRef(0);

  useEffect(() => {
    // Solo la última petición escribe el estado (las anteriores se descartan).
    const peticion = peticionDespieceRef.current + 1;
    peticionDespieceRef.current = peticion;
    const piezasActuales = piezasRef.current;
    if (piezasActuales.length === 0) {
      setDespiece(null);
      setErrorDespiece('');
      return;
    }
    calcularDespiecePiezas(piezasActuales)
      .then((resultado) => {
        if (peticion === peticionDespieceRef.current) {
          setDespiece(resultado);
          setErrorDespiece('');
        }
      })
      .catch((causa) => {
        if (peticion === peticionDespieceRef.current) {
          setDespiece(null);
          setErrorDespiece(
            causa instanceof Error ? causa.message : 'No se pudo calcular el despiece.',
          );
        }
      });
  }, [versionDespiece]);

  const piezaSeleccionada = piezas.find((p) => p.id === piezaSeleccionadaId) ?? null;

  async function anadirPieza(pieza: PiezaPlano): Promise<void> {
    try {
      cambiarPiezas([...piezasRef.current, pieza]);
      if (pieza.id) {
        setPiezaSeleccionadaId(pieza.id);
      }
      await guardarPiezas();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al añadir la pieza.');
    }
  }

  async function colocarPreset(
    modeloId: string,
    xCm: number,
    yCm: number,
    anchoCm: number,
    altoCm: number,
  ): Promise<void> {
    try {
      const piezasGeneradas = await generarPiezasPreset(modeloId, anchoCm, altoCm);
      const minX = Math.min(...piezasGeneradas.map((pieza) => pieza.x));
      const minY = Math.min(...piezasGeneradas.map((pieza) => pieza.y));
      const maxX = Math.max(...piezasGeneradas.map((pieza) => pieza.x + pieza.anchoCm));
      const maxY = Math.max(...piezasGeneradas.map((pieza) => pieza.y + pieza.altoCm));

      // En planos con hueco, la plantilla queda dentro del vano.
      let destinoX = xCm;
      let destinoY = yCm;
      if (proyecto.hueco) {
        destinoX = Math.min(Math.max(0, xCm), Math.max(0, proyecto.hueco.anchoCm - (maxX - minX)));
        destinoY = Math.min(Math.max(0, yCm), Math.max(0, proyecto.hueco.altoCm - (maxY - minY)));
      }

      const trasladadas: PiezaPlano[] = piezasGeneradas.map((pieza) => ({
        ...pieza,
        id: `pieza-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: Math.round(pieza.x - minX + destinoX),
        y: Math.round(pieza.y - minY + destinoY),
      }));
      cambiarPiezas([...piezasRef.current, ...trasladadas]);
      await guardarPiezas();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al colocar la plantilla.');
    }
  }

  async function eliminarPieza(id: string): Promise<void> {
    try {
      cambiarPiezas(piezasRef.current.filter((p) => p.id !== id));
      if (piezaSeleccionadaId === id) {
        setPiezaSeleccionadaId(null);
      }
      await guardarPiezas();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al eliminar la pieza.');
    }
  }

  /** Descarga el PDF del plano con las piezas, cotas, despiece y montaje. */
  function descargarPlano(): void {
    exportarPlanoPdf(piezas, piezaSeleccionada, proyecto.nombre, perfiles, {
      cliente: proyecto.cliente,
      direccion: proyecto.direccion,
      hueco: proyecto.hueco,
    });
  }

  /** Lienzo a pantalla completa y paneles de piezas/despiece como capas. */
  function editorDistribucion() {
    const esVista = modo === 'vista';
    return (
      <div className="editor-distribucion">
        <LienzoPlano
          piezas={piezas}
          modelos={modelos}
          perfiles={perfiles}
          piezasPersonalizadas={piezasPersonalizadas}
          hueco={proyecto.hueco ?? null}
          piezaSeleccionadaId={piezaSeleccionadaId}
          onSeleccionarPieza={setPiezaSeleccionadaId}
          onCambiarPiezas={cambiarPiezas}
          onGuardarCambios={() => void guardarPiezas()}
          onPiezaDibujada={anadirPieza}
          onPresetDibujado={colocarPreset}
          onAbrirPantallaCompleta={() => void alternarPantallaCompleta()}
          enPantallaCompleta={pantallaCompleta}
          modoVista={esVista}
          estadoGuardado={esVista ? undefined : estadoGuardado}
          onGuardar={esVista ? undefined : () => void guardarPiezas()}
        />

        {!esVista && panelesVisibles && (
          <aside className="panel-lateral">
            <header className="panel-lateral-cabecera">
              <h2>Piezas y despiece</h2>
              <button
                type="button"
                className="panel-lateral-cerrar"
                aria-label="Cerrar los paneles"
                onClick={() => setPanelesVisibles(false)}
              >
                ×
              </button>
            </header>

            <div className="panel-lateral-pestanas" role="tablist" aria-label="Secciones del panel">
              <button
                type="button"
                role="tab"
                aria-selected={vistaPanel === 'piezas'}
                className={`pestana ${vistaPanel === 'piezas' ? 'activa' : ''}`}
                onClick={() => setVistaPanel('piezas')}
              >
                Piezas
                <span className="pestana-cuenta">{piezas.length}</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={vistaPanel === 'despiece'}
                className={`pestana ${vistaPanel === 'despiece' ? 'activa' : ''}`}
                onClick={() => setVistaPanel('despiece')}
              >
                Despiece
              </button>
            </div>

            <div className="panel-lateral-cuerpo">
              {vistaPanel === 'piezas' ? (
                <PanelPiezas
                  piezas={piezas}
                  piezaSeleccionadaId={piezaSeleccionadaId}
                  onSeleccionarPieza={setPiezaSeleccionadaId}
                  onEliminarPieza={(id) => {
                    void eliminarPieza(id);
                  }}
                />
              ) : (
                <PanelDespiece
                  cantidadPiezas={piezas.length}
                  despiece={despiece}
                  error={errorDespiece}
                  piezaSeleccionada={piezaSeleccionada}
                  onEliminarPieza={(id) => {
                    void eliminarPieza(id);
                  }}
                />
              )}
            </div>
          </aside>
        )}
      </div>
    );
  }

  function accionesCabecera() {
    if (modo === 'vista') {
      return (
        <>
          <button
            type="button"
            className="boton-icono"
            onClick={descargarPlano}
            title="Descargar plano en PDF"
            aria-label="Descargar plano en PDF"
          >
            <IconoAccion nombre="descargar" />
          </button>
          <button
            type="button"
            className="boton-icono"
            onClick={() => setModo('edicion')}
            title="Editar plano"
            aria-label="Editar plano"
          >
            <IconoAccion nombre="lapiz" />
          </button>
        </>
      );
    }
    return (
      <>
        <button
          type="button"
          className="boton-icono"
          onClick={deshacer}
          disabled={!puedeDeshacer}
          title="Deshacer (Ctrl+Z)"
          aria-label="Deshacer"
        >
          <IconoAccion nombre="deshacer" />
        </button>
        <button
          type="button"
          className={`boton-icono ${panelesVisibles ? 'activo' : ''}`}
          onClick={() => setPanelesVisibles((visibles) => !visibles)}
          title="Piezas y despiece"
          aria-label="Piezas y despiece"
          aria-pressed={panelesVisibles}
        >
          <IconoAccion nombre="panel" />
        </button>
        <button
          type="button"
          className="boton-icono"
          onClick={descargarPlano}
          title="Descargar plano en PDF"
          aria-label="Descargar plano en PDF"
        >
          <IconoAccion nombre="descargar" />
        </button>
        <button
          type="button"
          className="boton-icono"
          onClick={() => setModo('vista')}
          title="Vista (solo lectura)"
          aria-label="Vista (solo lectura)"
        >
          <IconoAccion nombre="ojo" />
        </button>
      </>
    );
  }

  return (
    <div ref={contenedorRef} className="pantalla editor-plano">
      <header className="cabecera">
        <div className="editor-titulo">
          <h1>{proyecto.nombre}</h1>
          <span className="editor-hueco">
            {proyecto.hueco
              ? `Ancho ${proyecto.hueco.anchoCm} × altura ${proyecto.hueco.altoCm} cm`
              : 'Mapa libre'}
          </span>
        </div>
        <div className="acciones">{accionesCabecera()}</div>
      </header>

      {error && <p className="mensaje-error">{error}</p>}

      {editorDistribucion()}

      <AvisoOrientacion
        onIntentarHorizontal={() => void alternarPantallaCompleta()}
        titulo="El editor de planos se usa en horizontal"
        mensaje="En horizontal se ve el plano completo y se puede dibujar con precisión. Gira el dispositivo para continuar."
        preview={
          piezas.length > 0 || proyecto.hueco ? (
            <MiniaturaPlano piezas={piezas} perfiles={perfiles} hueco={proyecto.hueco} />
          ) : undefined
        }
      />
    </div>
  );
}
