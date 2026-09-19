import { useEffect, useRef, useState } from 'react';
import {
  calcularDespiecePiezas,
  generarPiezasPreset,
  obtenerCatalogoVentaneria,
  obtenerPerfilesVentaneria,
} from '../api/clienteApi';
import LienzoPlano from './LienzoPlano';
import PanelPiezas from './PanelPiezas';
import PanelDespiece from '../componentes/despiece/PanelDespiece';
import { exportarPlanoPdf } from '../pdf/exportarPlanoPdf';
import type {
  DespiecePiezas,
  ModeloVentaneria,
  PerfilVentaneria,
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
  const [piezas, setPiezas] = useState<PiezaPlano[]>(proyecto.piezas);
  const [piezaSeleccionadaId, setPiezaSeleccionadaId] = useState<string | null>(null);
  const [despiece, setDespiece] = useState<DespiecePiezas | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [panelesVisibles, setPanelesVisibles] = useState(false);
  const [error, setError] = useState('');
  const [estadoGuardado, setEstadoGuardado] = useState<EstadoGuardado>('sincronizado');
  const [versionDespiece, setVersionDespiece] = useState(0);

  const contenedorRef = useRef<HTMLDivElement>(null);
  const piezasRef = useRef<PiezaPlano[]>(proyecto.piezas);
  const esSucioRef = useRef(false);
  const guardandoRef = useRef(false);

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
  }, []);

  useEffect(() => {
    // La pantalla completa nativa puede salir con Esc: se sincroniza el estado.
    const alCambiar = (): void => setPantallaCompleta(document.fullscreenElement !== null);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  /** Abre o cierra la pantalla completa nativa del editor. */
  async function alternarPantallaCompleta(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await contenedorRef.current?.requestFullscreen();
      }
    } catch {
      // Si el navegador bloquea la pantalla completa, la edición continúa.
    }
  }

  /** Actualiza las piezas al instante (sin tocar el servidor). */
  function cambiarPiezas(nuevas: PiezaPlano[]): void {
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

  useEffect(() => {
    // Si no hay ediciones pendientes, las piezas locales siguen al proyecto
    // (p. ej. al cargar o tras un guardado del servidor).
    if (!esSucioRef.current) {
      piezasRef.current = proyecto.piezas;
      setPiezas(proyecto.piezas);
    }
  }, [proyecto.piezas]);

  useEffect(() => {
    let cancelado = false;
    const piezasActuales = piezasRef.current;
    if (piezasActuales.length === 0) {
      setDespiece(null);
      return;
    }
    calcularDespiecePiezas(piezasActuales)
      .then((resultado) => {
        if (!cancelado) {
          setDespiece(resultado);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setDespiece(null);
        }
      });
    return () => {
      cancelado = true;
    };
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
      const trasladadas: PiezaPlano[] = piezasGeneradas.map((pieza) => ({
        ...pieza,
        id: `pieza-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x: Math.round(pieza.x + xCm),
        y: Math.round(pieza.y + yCm),
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

  /** Descarga el PDF del plano con las piezas y cotas actuales. */
  function descargarPlano(): void {
    exportarPlanoPdf(piezas, piezaSeleccionada, proyecto.nombre);
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
          <>
            <button
              type="button"
              className="panel-lateral-fondo"
              aria-label="Cerrar los paneles"
              onClick={() => setPanelesVisibles(false)}
            />
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

              <PanelPiezas
                piezas={piezas}
                piezaSeleccionadaId={piezaSeleccionadaId}
                onSeleccionarPieza={setPiezaSeleccionadaId}
                onEliminarPieza={(id) => {
                  void eliminarPieza(id);
                }}
              />

              <PanelDespiece
                cantidadPiezas={piezas.length}
                despiece={despiece}
                piezaSeleccionada={piezaSeleccionada}
                onEliminarPieza={(id) => {
                  void eliminarPieza(id);
                }}
              />
            </aside>
          </>
        )}
      </div>
    );
  }

  function accionesCabecera() {
    if (modo === 'vista') {
      return (
        <button type="button" onClick={() => setModo('edicion')}>
          Editar
        </button>
      );
    }
    return (
      <>
        <button
          type="button"
          className={panelesVisibles ? 'activo' : ''}
          onClick={() => setPanelesVisibles((visibles) => !visibles)}
        >
          Piezas y despiece
        </button>
        <button type="button" onClick={descargarPlano}>
          Descargar plano
        </button>
        <button type="button" onClick={() => setModo('vista')}>
          Vista
        </button>
      </>
    );
  }

  return (
    <div ref={contenedorRef} className="pantalla editor-plano">
      <header className="cabecera">
        <h1>{proyecto.nombre}</h1>
        <div className="acciones">{accionesCabecera()}</div>
      </header>

      {error && <p className="mensaje-error">{error}</p>}

      {editorDistribucion()}
    </div>
  );
}
