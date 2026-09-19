import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  actualizarProyecto,
  crearProyecto,
  generarPiezasPreset,
  obtenerCatalogoVentaneria,
} from '../api/clienteApi';
import DisenoProyecto from '../components/DisenoProyecto';
import type { HuecoProyecto, ModeloVentaneria, Proyecto } from '../tipos';

type ModoLienzo = 'hueco' | 'libre';

function medidaDeTexto(texto: string): number | null {
  const numero = Number(texto.replace(',', '.'));
  if (!Number.isFinite(numero) || numero <= 0) {
    return null;
  }
  return Math.round(numero * 10) / 10;
}

export default function NuevoProyecto() {
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [modo, setModo] = useState<ModoLienzo>('hueco');
  const [huecoAncho, setHuecoAncho] = useState('120');
  const [huecoAlto, setHuecoAlto] = useState('100');
  const [modelos, setModelos] = useState<ModeloVentaneria[]>([]);
  const [modeloId, setModeloId] = useState('');
  const [anchoPlantilla, setAnchoPlantilla] = useState('100');
  const [altoPlantilla, setAltoPlantilla] = useState('140');
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerCatalogoVentaneria()
      .then(setModelos)
      .catch(() => setModelos([]));
  }, []);

  // Vista previa del hueco, escalada para que quepa en el panel.
  const vistaHueco = useMemo(() => {
    const ancho = medidaDeTexto(huecoAncho);
    const alto = medidaDeTexto(huecoAlto);
    if (!ancho || !alto) {
      return null;
    }
    const escala = Math.min(300 / ancho, 220 / alto, 2.2);
    return {
      ancho: Math.max(28, ancho * escala),
      alto: Math.max(28, alto * escala),
      real: { ancho, alto },
    };
  }, [huecoAncho, huecoAlto]);

  const modeloElegido = modelos.find((modelo) => modelo.id === modeloId) ?? null;

  function manejarCambioModelo(id: string): void {
    setModeloId(id);
    const elegido = modelos.find((modelo) => modelo.id === id);
    if (elegido && modo === 'libre') {
      setAnchoPlantilla(String(elegido.ejemplo.ancho));
      setAltoPlantilla(String(elegido.ejemplo.alto));
    }
  }

  async function manejarCreacion(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setError('');
    if (!nombre.trim()) {
      setError('Escribe un nombre para el proyecto.');
      return;
    }

    let hueco: HuecoProyecto | null = null;
    if (modo === 'hueco') {
      const ancho = medidaDeTexto(huecoAncho);
      const alto = medidaDeTexto(huecoAlto);
      if (!ancho || !alto) {
        setError('Indica un ancho y un alto válidos para el hueco.');
        return;
      }
      hueco = { anchoCm: ancho, altoCm: alto };
    }

    let medidasPlantilla: { ancho: number; alto: number } | null = null;
    if (modeloId) {
      if (hueco) {
        medidasPlantilla = { ancho: hueco.anchoCm, alto: hueco.altoCm };
      } else {
        const ancho = medidaDeTexto(anchoPlantilla);
        const alto = medidaDeTexto(altoPlantilla);
        if (!ancho || !alto) {
          setError('Indica el ancho y el alto de la plantilla.');
          return;
        }
        medidasPlantilla = { ancho, alto };
      }
    }

    setCreando(true);
    try {
      const creado = await crearProyecto({
        nombre: nombre.trim(),
        cliente: cliente.trim() || undefined,
        hueco,
      });

      if (modeloId && medidasPlantilla) {
        const generadas = await generarPiezasPreset(
          modeloId,
          medidasPlantilla.ancho,
          medidasPlantilla.alto,
        );
        const piezas = generadas.map((pieza, indice) => ({
          ...pieza,
          id: `pieza-${Date.now()}-${indice}-${Math.random().toString(36).slice(2, 7)}`,
        }));
        setProyecto(await actualizarProyecto(creado._id, { piezas }));
      } else {
        setProyecto(creado);
      }
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al crear el proyecto.');
    } finally {
      setCreando(false);
    }
  }

  async function actualizarProyectoEnServidor(datos: Partial<Proyecto>): Promise<Proyecto> {
    if (!proyecto) {
      throw new Error('Proyecto no creado.');
    }
    const actualizado = await actualizarProyecto(proyecto._id, datos);
    setProyecto(actualizado);
    return actualizado;
  }

  if (proyecto) {
    return <DisenoProyecto proyecto={proyecto} onActualizarProyecto={actualizarProyectoEnServidor} />;
  }

  return (
    <div className="pantalla">
      <header className="cabecera-editor">
        <h1>Nuevo proyecto</h1>
      </header>

      <div className="editor-distribucion">
        <div className="area-dibujo">
          <div className="vista-lienzo">
            {modo === 'hueco' ? (
              vistaHueco ? (
                <>
                  <div
                    className="vista-hueco"
                    style={{ width: `${vistaHueco.ancho}px`, height: `${vistaHueco.alto}px` }}
                  >
                    <span>
                      {vistaHueco.real.ancho} × {vistaHueco.real.alto} cm
                    </span>
                  </div>
                  <p className="vista-lienzo-pie">
                    {modeloElegido
                      ? `La plantilla «${modeloElegido.nombre}» se creará al tamaño del hueco.`
                      : 'El lienzo se creará con el tamaño del hueco.'}
                  </p>
                </>
              ) : (
                <p className="aviso-lienzo">
                  Indica el ancho y el alto del hueco para ver la vista previa.
                </p>
              )
            ) : (
              <p className="aviso-lienzo">
                Mapa libre: lienzo infinito con rejilla en centímetros.
                {modeloElegido
                  ? ` La plantilla «${modeloElegido.nombre}» se creará con las medidas que indiques.`
                  : ''}
              </p>
            )}
          </div>
        </div>

        <aside className="panel-nuevo-proyecto">
          <h2>Datos del proyecto</h2>
          <form onSubmit={manejarCreacion}>
            <label htmlFor="nombre">Nombre del proyecto</label>
            <input
              id="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej.: Escalera edificio San Martín"
              autoFocus
              required
            />

            <label htmlFor="cliente">Cliente</label>
            <input
              id="cliente"
              value={cliente}
              onChange={(evento) => setCliente(evento.target.value)}
              placeholder="Opcional"
            />

            <p className="form-seccion-titulo">Lienzo</p>
            <div className="opciones-lienzo" role="radiogroup" aria-label="Tipo de lienzo">
              <button
                type="button"
                role="radio"
                aria-checked={modo === 'hueco'}
                className={`opcion-lienzo ${modo === 'hueco' ? 'activa' : ''}`}
                onClick={() => setModo('hueco')}
              >
                <strong>Hueco de obra</strong>
                <span>Medidas reales del vano</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={modo === 'libre'}
                className={`opcion-lienzo ${modo === 'libre' ? 'activa' : ''}`}
                onClick={() => setModo('libre')}
              >
                <strong>Mapa libre</strong>
                <span>Lienzo infinito en cm</span>
              </button>
            </div>

            {modo === 'hueco' && (
              <div className="medidas-hueco">
                <div className="campo-medida">
                  <label htmlFor="hueco-ancho">Ancho (cm)</label>
                  <input
                    id="hueco-ancho"
                    type="number"
                    min="1"
                    step="1"
                    value={huecoAncho}
                    onChange={(evento) => setHuecoAncho(evento.target.value)}
                  />
                </div>
                <div className="campo-medida">
                  <label htmlFor="hueco-alto">Alto (cm)</label>
                  <input
                    id="hueco-alto"
                    type="number"
                    min="1"
                    step="1"
                    value={huecoAlto}
                    onChange={(evento) => setHuecoAlto(evento.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="form-seccion-titulo">Plantilla (opcional)</p>
            <label htmlFor="modelo">Modelo de ventanería</label>
            <select
              id="modelo"
              className="selector"
              value={modeloId}
              onChange={(evento) => manejarCambioModelo(evento.target.value)}
            >
              <option value="">Sin plantilla (dibujar a mano)</option>
              {modelos.map((modelo) => (
                <option key={modelo.id} value={modelo.id}>
                  {modelo.nombre}
                </option>
              ))}
            </select>

            {modeloId && modo === 'libre' && (
              <div className="medidas-hueco">
                <div className="campo-medida">
                  <label htmlFor="plantilla-ancho">Ancho plantilla (cm)</label>
                  <input
                    id="plantilla-ancho"
                    type="number"
                    min="1"
                    step="1"
                    value={anchoPlantilla}
                    onChange={(evento) => setAnchoPlantilla(evento.target.value)}
                  />
                </div>
                <div className="campo-medida">
                  <label htmlFor="plantilla-alto">Alto plantilla (cm)</label>
                  <input
                    id="plantilla-alto"
                    type="number"
                    min="1"
                    step="1"
                    value={altoPlantilla}
                    onChange={(evento) => setAltoPlantilla(evento.target.value)}
                  />
                </div>
              </div>
            )}

            {modeloId && modo === 'hueco' && (
              <p className="form-ayuda">
                La plantilla se ajustará al hueco de {huecoAncho || '—'} × {huecoAlto || '—'} cm.
              </p>
            )}

            {error && (
              <div className="aviso aviso-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="boton-primario" disabled={creando}>
              {creando ? 'Creando…' : 'Crear y dibujar plano'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
