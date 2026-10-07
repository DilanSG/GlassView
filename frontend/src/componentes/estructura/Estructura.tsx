import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { marcarTutorialVisto, obtenerProyectos } from '../../api/clienteApi';
import { useSesion } from '../../contextos/SesionContexto';
import type { Proyecto } from '../../tipos';
import AvisoPrueba from '../comunes/AvisoPrueba';
import BarraNavegacion from '../navegacion/BarraNavegacion';
import PieDePagina from '../navegacion/PieDePagina';
import SelectorTutorial from '../tutorial/SelectorTutorial';
import TutorialBienvenida from '../tutorial/TutorialBienvenida';
import { pasosDelGrupo, type GrupoTutorial } from '../tutorial/pasosTutorial';

/** El editor de planos se usa en horizontal; en móvil vertical se avisa. */
function enPantallaVertical(): boolean {
  return window.matchMedia('(max-width: 720px) and (orientation: portrait)').matches;
}

export default function Estructura() {
  const { pathname } = useLocation();
  const navegar = useNavigate();
  const { usuario, actualizarUsuario } = useSesion();
  const [tutorialAbierto, setTutorialAbierto] = useState(false);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [grupoTour, setGrupoTour] = useState<GrupoTutorial>('completo');
  const [reinicioTour, setReinicioTour] = useState(0);
  const [verticalAlIniciar, setVerticalAlIniciar] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[] | null>(null);
  const [cargandoProyectos, setCargandoProyectos] = useState(false);
  const tutorialOfrecido = useRef(false);
  // El editor ocupa toda la ventana: sin pie de página y con altura fija.
  const enEditor = /^\/proyectos\/[^/]+$/.test(pathname);

  // El tutorial se abre solo en el primer ingreso de una cuenta nueva; el
  // cerrojo evita reabrirlo cuando el perfil se actualiza al marcarlo visto.
  useEffect(() => {
    if (!usuario || tutorialOfrecido.current) {
      return;
    }
    tutorialOfrecido.current = true;
    if (!usuario.tutorialVisto) {
      setGrupoTour('completo');
      setVerticalAlIniciar(enPantallaVertical());
      setTutorialAbierto(true);
    }
  }, [usuario]);

  // Al abrir el selector se consultan los proyectos para adaptar las opciones.
  useEffect(() => {
    if (!selectorAbierto || !usuario) {
      return;
    }
    let vigente = true;
    setCargandoProyectos(true);
    obtenerProyectos()
      .then((lista) => {
        if (vigente) {
          setProyectos(lista);
        }
      })
      .catch(() => {
        if (vigente) {
          setProyectos([]);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoProyectos(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [selectorAbierto, usuario]);

  const pasos = useMemo(
    () => pasosDelGrupo(grupoTour, verticalAlIniciar),
    [grupoTour, verticalAlIniciar],
  );

  async function cerrarTutorial(): Promise<void> {
    setTutorialAbierto(false);
    if (!usuario || usuario.tutorialVisto) {
      return;
    }
    try {
      actualizarUsuario(await marcarTutorialVisto());
    } catch {
      // Si no se pudo guardar, el tutorial se ofrecerá otra vez en el próximo ingreso.
    }
  }

  /** Abre el recorrido elegido; el del plano usa el proyecto más reciente. */
  async function elegirGrupo(grupo: GrupoTutorial): Promise<void> {
    setSelectorAbierto(false);
    let destino: GrupoTutorial = grupo;
    if (grupo === 'plano') {
      let lista: Proyecto[] = [];
      try {
        lista = await obtenerProyectos();
      } catch {
        lista = [];
      }
      setProyectos(lista);
      if (lista.length > 0) {
        navegar(`/proyectos/${lista[0]._id}`);
      } else {
        // Sin proyectos no hay plano que explicar: se guía a crear uno.
        destino = 'nuevo-proyecto';
      }
    }
    setGrupoTour(destino);
    setVerticalAlIniciar(enPantallaVertical());
    setReinicioTour((valor) => valor + 1);
    setTutorialAbierto(true);
  }

  return (
    <div className={`estructura-app ${enEditor ? 'estructura-editor' : ''}`}>
      <BarraNavegacion />
      <AvisoPrueba />
      <main className="contenido-app">
        <Outlet />
      </main>
      {!enEditor && <PieDePagina onAbrirTutorial={() => setSelectorAbierto(true)} />}
      <SelectorTutorial
        abierto={selectorAbierto}
        cargando={cargandoProyectos}
        hayProyectos={(proyectos?.length ?? 0) > 0}
        onElegir={(grupo) => void elegirGrupo(grupo)}
        onCerrar={() => setSelectorAbierto(false)}
      />
      <TutorialBienvenida
        key={`${grupoTour}-${reinicioTour}`}
        abierto={tutorialAbierto}
        pasos={pasos}
        onElegirGrupo={(grupo) => void elegirGrupo(grupo)}
        onCerrar={cerrarTutorial}
      />
    </div>
  );
}
