import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import {
  actualizarPiezaPersonalizada,
  crearPiezaPersonalizada,
  eliminarPiezaPersonalizada,
  listarPiezasPersonalizadas,
} from '../api/clienteApi';
import BarraNavegacion from '../componentes/navegacion/BarraNavegacion';
import AvisoOrientacion from '../componentes/lienzo/AvisoOrientacion';
import EditorFormaPieza from '../componentes/piezas/EditorFormaPieza';
import InterruptorPublico from '../componentes/piezas/InterruptorPublico';
import MiniaturaForma from '../componentes/piezas/MiniaturaForma';
import ModalComunidad from '../componentes/piezas/ModalComunidad';
import ModalMateriales from '../componentes/piezas/ModalMateriales';
import { useSesion } from '../contextos/SesionContexto';
import { useEditorCompleto } from '../hooks/useEditorCompleto';
import {
  activarPantallaCompletaHorizontal,
  desactivarPantallaCompletaHorizontal,
  elementoEnPantallaCompleta,
} from '../utils/pantallaCompleta';
import {
  MATERIALES_PREDEFINIDOS,
  cargarMaterialesPropios,
  guardarMaterialPropio,
} from '../piezas/materiales';
import type {
  DatosPiezaPersonalizada,
  FormaPieza,
  MaterialPieza,
  MaterialPiezaGuardado,
  PerfilCategoria,
  PiezaPersonalizada,
  TipoPiezaPersonalizada,
} from '../tipos';

const CATEGORIAS_PERFIL: PerfilCategoria[] = [
  'cabezal',
  'sillar',
  'jamba',
  'hoja',
  'horizontal',
  'riel',
  'canal-u',
  'empaque',
  'otro',
];

const ETIQUETA_CATEGORIA: Partial<Record<PerfilCategoria, string>> = {
  cabezal: 'Cabezal',
  sillar: 'Sillar',
  jamba: 'Jamba',
  hoja: 'Hoja (enganche/traslape)',
  horizontal: 'Horizontal',
  riel: 'Riel',
  'canal-u': 'Canal U',
  empaque: 'Empaque / felpa',
  rodachina: 'Rodachina',
  manija: 'Manija / seguro',
  otro: 'Otra',
};

const ETIQUETA_TIPO: Record<TipoPiezaPersonalizada, string> = {
  perfil: 'Perfil',
  vidrio: 'Vidrio',
  acrilico: 'Acrílico',
  herraje: 'Herraje',
};

interface Borrador {
  id: string | null;
  propia: boolean;
  /** Identifica la edición en curso: al cambiar, el editor reinicia su historial. */
  clave: string;
  nombre: string;
  ref: string;
  tipo: TipoPiezaPersonalizada;
  categoria: PerfilCategoria;
  publico: boolean;
  espesorMm: number;
  material?: MaterialPiezaGuardado;
  forma: FormaPieza;
}

function formaPorDefecto(): FormaPieza {
  return {
    anchoCm: 20,
    altoCm: 20,
    trazos: [{ rol: 'contorno', cerrado: false, visible: true, puntos: [] }],
  };
}

function borradorNuevo(): Borrador {
  return {
    id: null,
    propia: true,
    clave: `nueva-${Date.now().toString(36)}`,
    nombre: '',
    ref: '',
    tipo: 'perfil',
    categoria: 'otro',
    publico: false,
    espesorMm: 4,
    forma: formaPorDefecto(),
  };
}

function categoriasDeTipo(tipo: TipoPiezaPersonalizada): PerfilCategoria[] {
  if (tipo === 'herraje') return ['rodachina', 'manija', 'otro'];
  if (tipo === 'perfil') return CATEGORIAS_PERFIL;
  return ['otro'];
}

function tieneFiguraCerrada(forma: FormaPieza): boolean {
  return forma.trazos.some((trazo) => trazo.cerrado !== false && trazo.puntos.length >= 3);
}

export default function PiezasPersonalizadas() {
  const { usuario } = useSesion();
  const [piezas, setPiezas] = useState<PiezaPersonalizada[]>([]);
  const [borrador, setBorrador] = useState<Borrador>(() => borradorNuevo());
  const [materialesPropios, setMaterialesPropios] = useState<MaterialPieza[]>(() =>
    cargarMaterialesPropios(),
  );
  const [modalComunidad, setModalComunidad] = useState(false);
  const [modalMateriales, setModalMateriales] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [editorAbierto, setEditorAbierto] = useState(false);
  const editorCompleto = useEditorCompleto();

  const editorCompletoRef = useRef<HTMLDivElement>(null);

  /** Pide la pantalla completa del editor y bloquea el horizontal si se puede. */
  async function solicitarPantallaCompleta(): Promise<void> {
    await activarPantallaCompletaHorizontal(editorCompletoRef.current);
  }

  function abrirEditor(): void {
    // El overlay se muestra ya mismo para poder pedir la pantalla completa
    // dentro del mismo gesto del usuario (si no, el navegador la rechaza).
    flushSync(() => setEditorAbierto(true));
    void solicitarPantallaCompleta();
  }

  function cerrarEditor(): void {
    setEditorAbierto(false);
    void desactivarPantallaCompletaHorizontal();
  }

  // Reintento tras el render, por si el primer intento no quedó a pantalla completa.
  useLayoutEffect(() => {
    if (editorAbierto && !elementoEnPantallaCompleta()) {
      void solicitarPantallaCompleta();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorAbierto]);

  // Salir de la pantalla completa (gesto atrás, Esc) cierra el editor.
  useEffect(() => {
    function alCambiarPantalla(): void {
      if (!elementoEnPantallaCompleta()) {
        setEditorAbierto(false);
      }
    }
    document.addEventListener('fullscreenchange', alCambiarPantalla);
    document.addEventListener('webkitfullscreenchange', alCambiarPantalla);
    return () => {
      document.removeEventListener('fullscreenchange', alCambiarPantalla);
      document.removeEventListener('webkitfullscreenchange', alCambiarPantalla);
    };
  }, []);

  // Mientras el editor está abierto la página de fondo no se desplaza.
  useEffect(() => {
    if (!editorAbierto) {
      return;
    }
    const anterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [editorAbierto]);

  useEffect(() => {
    listarPiezasPersonalizadas()
      .then(setPiezas)
      .catch((causa) =>
        setError(causa instanceof Error ? causa.message : 'No se pudo cargar la biblioteca.'),
      );
  }, []);

  const propias = piezas.filter((pieza) => pieza.usuario === usuario?._id);
  const comunidad = piezas.filter((pieza) => pieza.publico && pieza.usuario !== usuario?._id);
  const tieneFigura = tieneFiguraCerrada(borrador.forma);
  const materialesDisponibles = useMemo(
    () => [...MATERIALES_PREDEFINIDOS, ...materialesPropios],
    [materialesPropios],
  );

  function seleccionar(valor: string): void {
    setMensaje('');
    setError('');
    setConfirmarEliminar(false);
    if (valor === 'nueva') {
      setBorrador(borradorNuevo());
      return;
    }
    const pieza = piezas.find((candidata) => candidata._id === valor);
    if (!pieza) return;
    setBorrador({
      id: pieza._id,
      propia: pieza.usuario === usuario?._id,
      clave: pieza._id,
      nombre: pieza.nombre,
      ref: pieza.ref,
      tipo: pieza.tipo,
      categoria: pieza.categoria,
      publico: pieza.publico,
      espesorMm: pieza.espesorMm ?? 4,
      material: pieza.material,
      forma: pieza.forma,
    });
  }

  function usarDeComunidad(pieza: PiezaPersonalizada): void {
    seleccionar(pieza._id);
    setModalComunidad(false);
  }

  function aplicarMaterial(material: MaterialPieza): void {
    setBorrador((actual) => ({
      ...actual,
      material: { nombre: material.nombre, color: material.color },
      tipo: material.tipo,
      categoria: categoriasDeTipo(material.tipo)[0],
      forma: { ...actual.forma, color: material.color },
    }));
  }

  function elegirMaterial(material: MaterialPieza | null): void {
    if (!material) {
      setBorrador((actual) => ({ ...actual, material: undefined }));
      return;
    }
    aplicarMaterial(material);
  }

  function crearMaterial(material: MaterialPieza): void {
    registrarMaterialPropio(material);
    aplicarMaterial(material);
  }

  /** Guarda un material propio sin tocar la pieza (lo usa el editor de capas). */
  function registrarMaterialPropio(material: MaterialPieza): void {
    guardarMaterialPropio(material);
    setMaterialesPropios(cargarMaterialesPropios());
  }

  async function guardar(): Promise<void> {
    if (!borrador.propia) return;
    if (borrador.nombre.trim().length < 2) {
      setError('Ponle un nombre a la pieza.');
      return;
    }
    const datos: DatosPiezaPersonalizada = {
      nombre: borrador.nombre.trim(),
      ref: borrador.ref.trim() || undefined,
      tipo: borrador.tipo,
      categoria: borrador.categoria,
      publico: borrador.publico,
      espesorMm: borrador.espesorMm,
      material: borrador.material,
      forma: borrador.forma,
    };
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const guardada = borrador.id
        ? await actualizarPiezaPersonalizada(borrador.id, datos)
        : await crearPiezaPersonalizada(datos);
      setPiezas((actuales) => [guardada, ...actuales.filter((pieza) => pieza._id !== guardada._id)]);
      setBorrador((actual) => ({ ...actual, id: guardada._id, ref: guardada.ref }));
      setMensaje('Pieza guardada.');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo guardar la pieza.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(): Promise<void> {
    if (!borrador.id) return;
    try {
      await eliminarPiezaPersonalizada(borrador.id);
      setPiezas((actuales) => actuales.filter((pieza) => pieza._id !== borrador.id));
      setBorrador(borradorNuevo());
      setConfirmarEliminar(false);
      setMensaje('Pieza eliminada.');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo eliminar la pieza.');
    }
  }

  return (
    <div className="pantalla">
      <header className="pagina-cabecera">
        <h2>Piezas</h2>
        <p>
          Editor de formas: dibuja el contorno de una pieza, asígnale su material y guárdala para
          reutilizarla en los planos.
        </p>
      </header>

      {mensaje && (
        <div className="aviso aviso-exito" role="status">
          {mensaje}
        </div>
      )}
      {error && (
        <div className="aviso aviso-error" role="alert">
          {error}
        </div>
      )}

      <section className="piezas-editor" data-tour="piezas-editor">
        <div className="piezas-editor-barra">
          <label className="piezas-selector">
            <span>Pieza</span>
            <select value={borrador.id ?? 'nueva'} onChange={(evento) => seleccionar(evento.target.value)}>
              <option value="nueva">Nueva pieza</option>
              {propias.length > 0 && (
                <optgroup label="Piezas guardadas">
                  {propias.map((pieza) => (
                    <option key={pieza._id} value={pieza._id}>
                      {pieza.nombre} · {pieza.ref}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          <div className="piezas-editor-acciones">
            <button
              type="button"
              className="boton-secundario"
              data-tour="piezas-comunidad"
              onClick={() => setModalComunidad(true)}
            >
              Piezas de la comunidad
              {comunidad.length > 0 && <span className="piezas-editor-cuenta">{comunidad.length}</span>}
            </button>
            {borrador.id && borrador.propia && (
              <>
                {confirmarEliminar ? (
                  <>
                    <button type="button" className="boton-mini peligro" onClick={() => void eliminar()}>
                      Sí, eliminar
                    </button>
                    <button type="button" className="boton-mini" onClick={() => setConfirmarEliminar(false)}>
                      Cancelar
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="boton-secundario"
                    onClick={() => setConfirmarEliminar(true)}
                    disabled={guardando}
                  >
                    Eliminar
                  </button>
                )}
              </>
            )}
            {borrador.propia && (
              <button
                type="button"
                className="boton-primario"
                data-tour="piezas-guardar"
                onClick={() => void guardar()}
                disabled={guardando}
              >
                {guardando ? 'Guardando…' : 'Guardar pieza'}
              </button>
            )}
          </div>
        </div>

        {!borrador.propia && (
          <p className="piezas-editor-aviso">
            Pieza de otra cuenta: se puede colocar en los planos desde la barra de
            herramientas, pero no editar.
          </p>
        )}

        <div className="piezas-editor-campos" data-tour="piezas-campos">
          <label>
            Nombre
            <input
              value={borrador.nombre}
              onChange={(evento) => setBorrador({ ...borrador, nombre: evento.target.value })}
              placeholder="Ej.: Perfil decorativo"
            />
          </label>
          <label>
            REF
            <input
              value={borrador.ref}
              onChange={(evento) => setBorrador({ ...borrador, ref: evento.target.value })}
              placeholder="Automática"
            />
          </label>
          {(borrador.tipo === 'perfil' || borrador.tipo === 'herraje') && (
            <label>
              Uso
              <select
                value={borrador.categoria}
                onChange={(evento) =>
                  setBorrador({ ...borrador, categoria: evento.target.value as PerfilCategoria })
                }
              >
                {categoriasDeTipo(borrador.tipo).map((categoria) => (
                  <option key={categoria} value={categoria}>
                    {ETIQUETA_CATEGORIA[categoria] ?? categoria}
                  </option>
                ))}
              </select>
            </label>
          )}
          {(borrador.tipo === 'vidrio' || borrador.tipo === 'acrilico') && (
            <label>
              Espesor (mm)
              <input
                type="number"
                min="1"
                max="30"
                step="0.5"
                value={borrador.espesorMm}
                onChange={(evento) =>
                  setBorrador({ ...borrador, espesorMm: Number(evento.target.value) || 4 })
                }
              />
            </label>
          )}
        </div>

        {tieneFigura && (
          <div className="piezas-material">
            <button
              type="button"
              className="piezas-material-card"
              onClick={() => setModalMateriales(true)}
            >
              {borrador.material ? (
                <>
                  <span
                    className="piezas-material-muestra"
                    style={{ backgroundColor: borrador.material.color }}
                  />
                  <span className="piezas-material-datos">
                    <span className="piezas-material-nombre">{borrador.material.nombre}</span>
                    <span className="piezas-material-tipo">{ETIQUETA_TIPO[borrador.tipo]}</span>
                  </span>
                </>
              ) : (
                <span className="piezas-material-vacio">Elegir material…</span>
              )}
              <span className="piezas-material-cambiar">Cambiar</span>
            </button>
          </div>
        )}

        <div className="piezas-publico">
          <div className="piezas-publico-texto">
            <span className="piezas-publico-etiqueta">Compartir con la comunidad</span>
            <span className="piezas-publico-ayuda">
              Las piezas públicas aparecen en la barra de herramientas de todos.
            </span>
          </div>
          <InterruptorPublico
            activo={borrador.publico}
            onCambiar={(activo) => setBorrador({ ...borrador, publico: activo })}
          />
        </div>

        {editorCompleto ? (
          <div className="piezas-editor-acceso" data-tour="piezas-editor-acceso">
            <button
              type="button"
              className="piezas-editor-acceso-boton"
              onClick={abrirEditor}
              aria-haspopup="dialog"
            >
              <span className="piezas-editor-acceso-vista">
                {tieneFigura ? (
                  <MiniaturaForma forma={borrador.forma} tipo={borrador.tipo} />
                ) : (
                  <svg
                    className="piezas-editor-acceso-vacio"
                    viewBox="0 0 24 24"
                    width="26"
                    height="26"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                    <path d="m13.5 6.5 4 4" />
                  </svg>
                )}
              </span>
              <span className="piezas-editor-acceso-texto">
                <span className="piezas-editor-acceso-titulo">Abrir editor de la pieza</span>
                <span className="piezas-editor-acceso-ayuda">
                  Se abre a pantalla completa con las herramientas, el lienzo y las capas. En
                  pantallas pequeñas se dibuja en horizontal.
                </span>
              </span>
            </button>
          </div>
        ) : (
          <EditorFormaPieza
            forma={borrador.forma}
            tipo={borrador.tipo}
            clave={borrador.clave}
            onCambiar={(forma) => setBorrador((actual) => ({ ...actual, forma }))}
            materiales={materialesDisponibles}
            onCrearMaterial={registrarMaterialPropio}
          />
        )}
      </section>

      {modalComunidad && (
        <ModalComunidad
          piezas={comunidad}
          onElegir={usarDeComunidad}
          onCerrar={() => setModalComunidad(false)}
        />
      )}

      {modalMateriales && (
        <ModalMateriales
          materiales={materialesDisponibles}
          seleccionado={borrador.material?.nombre}
          onElegir={elegirMaterial}
          onCrear={crearMaterial}
          onCerrar={() => setModalMateriales(false)}
        />
      )}

      {/* Editor a pantalla completa: solo herramientas, lienzo y capas. */}
      <div
        ref={editorCompletoRef}
        className={`editor-completo ${editorAbierto ? 'abierto' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Editor de la pieza"
      >
        {editorAbierto && (
          <>
            {/* La barra de navegación se mantiene en la vista de girar (vertical). */}
            <BarraNavegacion />
            <header className="editor-completo-barra">
              <span className="editor-completo-titulo">
                {borrador.nombre.trim() || 'Nueva pieza'}
              </span>
              <button
                type="button"
                className="editor-completo-cerrar"
                onClick={cerrarEditor}
                aria-label="Cerrar el editor"
                title="Cerrar el editor"
              >
                ×
              </button>
            </header>
            <EditorFormaPieza
              forma={borrador.forma}
              tipo={borrador.tipo}
              clave={borrador.clave}
              onCambiar={(forma) => setBorrador((actual) => ({ ...actual, forma }))}
              materiales={materialesDisponibles}
              onCrearMaterial={registrarMaterialPropio}
            />
            <AvisoOrientacion
              onIntentarHorizontal={() => void solicitarPantallaCompleta()}
              titulo="El editor de piezas se usa en horizontal"
              mensaje="En horizontal se ve el lienzo completo y se dibuja con precisión. Gira el dispositivo para continuar."
              preview={
                tieneFigura ? (
                  <MiniaturaForma forma={borrador.forma} tipo={borrador.tipo} />
                ) : undefined
              }
            />
          </>
        )}
      </div>
    </div>
  );
}