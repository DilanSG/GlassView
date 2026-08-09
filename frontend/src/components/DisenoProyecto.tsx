import { useEffect, useState } from 'react';
import {
  calcularDespiecePiezas,
  generarPiezasPreset,
  obtenerCatalogoVentaneria,
  obtenerPerfilesVentaneria,
} from '../api/clienteApi';
import LienzoPlano from './LienzoPlano';
import PanelPiezas from './PanelPiezas';
import PanelDespiece from '../componentes/despiece/PanelDespiece';
import type {
  DespiecePiezas,
  ModeloVentaneria,
  PerfilVentaneria,
  PiezaPlano,
  Proyecto,
} from '../tipos';

interface DisenoProyectoProps {
  proyecto: Proyecto;
  onActualizarProyecto: (datos: Partial<Proyecto>) => Promise<Proyecto>;
}

/**
 * Editor de diseño reutilizable: lienzo CAD con piezas individuales
 * y panel de despiece agrupado por REF.
 */
export default function DisenoProyecto({
  proyecto,
  onActualizarProyecto,
}: DisenoProyectoProps) {
  const [modelos, setModelos] = useState<ModeloVentaneria[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilVentaneria[]>([]);
  const [piezaSeleccionadaId, setPiezaSeleccionadaId] = useState<string | null>(null);
  const [despiece, setDespiece] = useState<DespiecePiezas | null>(null);
  const [pantallaCompleta, setPantallaCompleta] = useState(false);
  const [error, setError] = useState('');

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

  async function guardarPiezas(piezas: PiezaPlano[]): Promise<void> {
    try {
      await onActualizarProyecto({ piezas });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al guardar las piezas.');
    }
  }

  async function anadirPieza(pieza: PiezaPlano): Promise<void> {
    try {
      await onActualizarProyecto({ piezas: [...proyecto.piezas, pieza] });
      if (pieza.id) {
        setPiezaSeleccionadaId(pieza.id);
      }
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
      await onActualizarProyecto({ piezas: [...proyecto.piezas, ...trasladadas] });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al colocar la plantilla.');
    }
  }

  useEffect(() => {
    let cancelado = false;
    calcularDespiecePiezas(proyecto.piezas)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proyecto.piezas]);

  const piezaSeleccionada =
    proyecto.piezas.find((p) => p.id === piezaSeleccionadaId) ?? null;

  async function eliminarPieza(id: string): Promise<void> {
    try {
      await guardarPiezas(proyecto.piezas.filter((p) => p.id !== id));
      if (piezaSeleccionadaId === id) {
        setPiezaSeleccionadaId(null);
      }
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al eliminar la pieza.');
    }
  }

  /** Distribución completa del editor: lienzo y paneles laterales. */
  function editorDistribucion(enPantallaCompleta: boolean) {
    return (
      <div className="editor-distribucion">
        <LienzoPlano
          piezas={proyecto.piezas}
          modelos={modelos}
          perfiles={perfiles}
          piezaSeleccionadaId={piezaSeleccionadaId}
          onSeleccionarPieza={setPiezaSeleccionadaId}
          onCambiarPiezas={guardarPiezas}
          onPiezaDibujada={anadirPieza}
          onPresetDibujado={colocarPreset}
          onAbrirPantallaCompleta={
            enPantallaCompleta ? undefined : () => setPantallaCompleta(true)
          }
          enPantallaCompleta={enPantallaCompleta}
          nombrePlano={proyecto.nombre}
        />

        <div className="panel-lateral">
          <PanelPiezas
            piezas={proyecto.piezas}
            piezaSeleccionadaId={piezaSeleccionadaId}
            onSeleccionarPieza={setPiezaSeleccionadaId}
            onEliminarPieza={(id) => {
              void eliminarPieza(id);
            }}
          />

          <PanelDespiece
            cantidadPiezas={proyecto.piezas.length}
            despiece={despiece}
            piezaSeleccionada={piezaSeleccionada}
            onEliminarPieza={(id) => {
              void eliminarPieza(id);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="pantalla editor-plano">
      <header className="cabecera">
        <h1>{proyecto.nombre}</h1>
      </header>

      {error && <p className="mensaje-error">{error}</p>}

      {pantallaCompleta ? (
        <div className="pantalla-completa">
          <header className="cabecera-pantalla-completa">
            <h1>{proyecto.nombre}</h1>
            <div className="acciones">
              <button type="button" onClick={() => setPantallaCompleta(false)}>
                Salir de pantalla completa
              </button>
            </div>
          </header>
          <div className="pantalla-completa-cuerpo">{editorDistribucion(true)}</div>
        </div>
      ) : (
        editorDistribucion(false)
      )}
    </div>
  );
}