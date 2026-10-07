import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import {
  actualizarProyecto,
  crearProyecto,
  generarPiezasPreset,
  obtenerCatalogoVentaneria,
  obtenerPerfilesVentaneria,
} from '../api/clienteApi';
import DisenoProyecto from '../componentes/editor/DisenoProyecto';
import { EVENTO_TUTORIAL, type EventoTutorial } from '../componentes/tutorial/pasosTutorial';
import MiniaturaPlano from '../componentes/piezas/MiniaturaPlano';
import type { HuecoProyecto, ModeloVentaneria, PerfilVentaneria, PiezaPlano, Proyecto } from '../tipos';

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
  const [perfiles, setPerfiles] = useState<PerfilVentaneria[]>([]);
  const [piezasPreview, setPiezasPreview] = useState<PiezaPlano[] | null>(null);
  const [generandoPreview, setGenerandoPreview] = useState(false);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');
  const [sugerenciaTour, setSugerenciaTour] = useState(false);

  useEffect(() => {
    obtenerCatalogoVentaneria()
      .then(setModelos)
      .catch(() => setModelos([]));
    obtenerPerfilesVentaneria()
      .then(setPerfiles)
      .catch(() => setPerfiles([]));
  }, []);

  // El tutorial puede prellenar el nombre y elegir una plantilla de ejemplo.
  useEffect(() => {
    function manejarTutorial(evento: Event): void {
      const detalle = (evento as CustomEvent<EventoTutorial>).detail;
      if (!detalle) {
        return;
      }
      if (detalle.accion === 'prellenar-proyecto') {
        setNombre((actual) => actual || 'Proyecto de ejemplo');
      } else if (detalle.accion === 'elegir-plantilla') {
        setSugerenciaTour(true);
      } else if (detalle.accion === 'preparar-nuevo-proyecto') {
        // Vuelve al asistente aunque el editor esté abierto (recorrido repetido).
        setProyecto(null);
      }
    }
    window.addEventListener(EVENTO_TUTORIAL, manejarTutorial);
    return () => window.removeEventListener(EVENTO_TUTORIAL, manejarTutorial);
  }, []);

  // La plantilla de ejemplo se elige cuando el catálogo ya está cargado.
  useEffect(() => {
    if (sugerenciaTour && !modeloId && modelos.length > 0) {
      setModeloId(modelos[0].id);
    }
  }, [sugerenciaTour, modeloId, modelos]);

  // Medidas de la vista previa: las del hueco o las de la plantilla en mapa libre.
  const medidasPreview = useMemo(() => {
    if (modo === 'hueco') {
      const ancho = medidaDeTexto(huecoAncho);
      const alto = medidaDeTexto(huecoAlto);
      return ancho && alto ? { ancho, alto } : null;
    }
    const ancho = medidaDeTexto(anchoPlantilla);
    const alto = medidaDeTexto(altoPlantilla);
    return ancho && alto ? { ancho, alto } : null;
  }, [modo, huecoAncho, huecoAlto, anchoPlantilla, altoPlantilla]);

  // Vista previa escalada para que quepa en la tarjeta.
  const vistaPreview = useMemo(() => {
    if (!medidasPreview) {
      return null;
    }
    const escala = Math.min(360 / medidasPreview.ancho, 300 / medidasPreview.alto, 3.2);
    return {
      ancho: Math.max(28, medidasPreview.ancho * escala),
      alto: Math.max(28, medidasPreview.alto * escala),
      real: medidasPreview,
    };
  }, [medidasPreview]);

  // La plantilla elegida se dibuja en la vista previa con sus piezas reales.
  useEffect(() => {
    if (!modeloId || !medidasPreview) {
      setPiezasPreview(null);
      setGenerandoPreview(false);
      return;
    }
    let vigente = true;
    const temporizador = window.setTimeout(() => {
      setGenerandoPreview(true);
      generarPiezasPreset(modeloId, medidasPreview.ancho, medidasPreview.alto)
        .then((piezas) => {
          if (vigente) setPiezasPreview(piezas);
        })
        .catch(() => {
          if (vigente) setPiezasPreview(null);
        })
        .finally(() => {
          if (vigente) setGenerandoPreview(false);
        });
    }, 250);
    return () => {
      vigente = false;
      window.clearTimeout(temporizador);
    };
  }, [modeloId, medidasPreview]);

  const modeloElegido = modelos.find((modelo) => modelo.id === modeloId) ?? null;

  // La vista previa se adapta al ancho disponible manteniendo su proporción.
  const estiloPreview = vistaPreview
    ? ({
        '--ancho-preview': `${vistaPreview.ancho}px`,
        '--ratio-preview': `${vistaPreview.real.ancho} / ${vistaPreview.real.alto}`,
      } as CSSProperties)
    : undefined;

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
      <header className="pagina-cabecera">
        <h2>Nuevo proyecto</h2>
        <p>
          Define las medidas del hueco y, si quieres, parte de una plantilla de ventanería. El
          plano se abrirá listo para dibujar.
        </p>
      </header>

      <div className="nuevo-proyecto">
        <section className="tarjeta-lienzo" aria-label="Vista previa del lienzo" data-tour="nuevo-preview">
          <header className="tarjeta-lienzo-cabecera">
            <span className="tarjeta-lienzo-titulo">Vista previa</span>
            {vistaPreview && (
              <span className="tarjeta-lienzo-medidas">
                {vistaPreview.real.ancho} × {vistaPreview.real.alto} cm
              </span>
            )}
          </header>

          <div className={`vista-lienzo ${generandoPreview ? 'generando' : ''}`}>
            {vistaPreview ? (
              piezasPreview ? (
                <div className="vista-plantilla" style={estiloPreview}>
                  <MiniaturaPlano
                    piezas={piezasPreview}
                    perfiles={perfiles}
                    hueco={
                      modo === 'hueco'
                        ? {
                            anchoCm: vistaPreview.real.ancho,
                            altoCm: vistaPreview.real.alto,
                          }
                        : null
                    }
                  />
                </div>
              ) : modo === 'hueco' ? (
                <div className="vista-hueco" style={estiloPreview}>
                  <span>
                    {vistaPreview.real.ancho} × {vistaPreview.real.alto} cm
                  </span>
                </div>
              ) : (
                <p className="aviso-lienzo">
                  Mapa libre: lienzo infinito con rejilla en centímetros.
                </p>
              )
            ) : (
              <p className="aviso-lienzo">
                {modo === 'hueco'
                  ? 'Indica el ancho y el alto del hueco para ver la vista previa.'
                  : 'Indica el ancho y el alto de la plantilla para ver la vista previa.'}
              </p>
            )}
          </div>

          <p className="vista-lienzo-pie">
            {modo === 'hueco'
              ? modeloElegido
                ? `La plantilla «${modeloElegido.nombre}» se creará al tamaño del hueco.`
                : 'El lienzo se creará con el tamaño del hueco.'
              : modeloElegido
                ? `La plantilla «${modeloElegido.nombre}» se creará con las medidas que indiques.`
                : 'Sin medidas de obra: podrás dibujar en cualquier parte del lienzo.'}
          </p>
        </section>

        <form className="nuevo-proyecto-form" onSubmit={manejarCreacion}>
          <section className="tarjeta-form" data-tour="nuevo-datos">
            <h3>Datos del proyecto</h3>

            <label htmlFor="nombre">Nombre del proyecto</label>
            <input
              id="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej.: Escalera edificio San Martín"
              required
            />

            <label htmlFor="cliente">Cliente</label>
            <input
              id="cliente"
              value={cliente}
              onChange={(evento) => setCliente(evento.target.value)}
              placeholder="Opcional"
            />
          </section>

          <section className="tarjeta-form" data-tour="nuevo-lienzo">
            <h3>Lienzo y plantilla</h3>

            <div className="opciones-lienzo" role="radiogroup" aria-label="Tipo de lienzo">
              <button
                type="button"
                role="radio"
                aria-checked={modo === 'hueco'}
                className={`opcion-lienzo ${modo === 'hueco' ? 'activa' : ''}`}
                onClick={() => setModo('hueco')}
              >
                <strong>Hueco de obra</strong>
                <span>Medidas reales: ancho × altura</span>
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
          </section>

          <div className="nuevo-proyecto-acciones">
            {error && (
              <div className="aviso aviso-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              data-tour="nuevo-crear"
              className="boton-primario boton-crear-proyecto"
              disabled={creando}
            >
              {creando ? 'Creando…' : 'Crear y dibujar plano'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
