import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { eliminarProyecto, obtenerProyectos } from '../api/clienteApi';
import type { Proyecto } from '../tipos';

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function Proyectos() {
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const navegar = useNavigate();

  const seccionCabeceraRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const vacioRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    cargarProyectos();
  }, []);

  useEffect(() => {
    const contexto = gsap.context(() => {
      if (seccionCabeceraRef.current) {
        gsap.fromTo(
          seccionCabeceraRef.current,
          { y: 12, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out' },
        );
      }
    });

    return () => contexto.revert();
  }, []);

  useEffect(() => {
    if (cargando) {
      return;
    }

    const contexto = gsap.context(() => {
      if (proyectos.length === 0 && vacioRef.current) {
        gsap.fromTo(
          vacioRef.current,
          { y: 18, autoAlpha: 0 },
          { y: 0, autoAlpha: 1, duration: 0.45, ease: 'power2.out' },
        );
      }

      if (proyectos.length > 0 && listaRef.current) {
        const tarjetas = listaRef.current.querySelectorAll('.tarjeta-proyecto');
        gsap.fromTo(
          tarjetas,
          { y: 24, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            duration: 0.45,
            stagger: 0.07,
            ease: 'power2.out',
            overwrite: true,
          },
        );
      }
    });

    return () => contexto.revert();
  }, [cargando, proyectos]);

  async function cargarProyectos(): Promise<void> {
    setCargando(true);
    try {
      const lista = await obtenerProyectos();
      setProyectos(lista);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al cargar los proyectos.');
    } finally {
      setCargando(false);
    }
  }

  async function manejarEliminacion(id: string): Promise<void> {
    const confirmado = window.confirm('¿Eliminar este proyecto? Esta acción no se puede deshacer.');
    if (!confirmado) {
      return;
    }
    try {
      await eliminarProyecto(id);
      await cargarProyectos();
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al eliminar el proyecto.');
    }
  }

  return (
    <div className="pantalla">
      <section className="seccion-proyectos">
        <div className="seccion-titulo" ref={seccionCabeceraRef}>
          <h2>Mis proyectos</h2>
          {proyectos.length > 0 && (
            <span className="subtitulo-contador">
              {proyectos.length} {proyectos.length === 1 ? 'proyecto' : 'proyectos'}
            </span>
          )}
        </div>

        {error && (
          <div className="aviso aviso-error" role="alert">
            {error}
          </div>
        )}

        {cargando ? (
          <p className="sin-datos">Cargando proyectos...</p>
        ) : proyectos.length === 0 ? (
          <div className="estado-vacio" ref={vacioRef}>
            <p>Todavía no hay proyectos.</p>
            <p className="estado-vacio-ayuda">
              Usa la pestaña «Nuevo proyecto» para crear el primero.
            </p>
          </div>
        ) : (
          <ul className="lista-proyectos" ref={listaRef}>
            {proyectos.map((proyecto) => (
              <li key={proyecto._id}>
                <div
                  className="tarjeta-proyecto"
                  onClick={() => navegar(`/proyectos/${proyecto._id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(evento) => {
                    if (evento.key === 'Enter') {
                      navegar(`/proyectos/${proyecto._id}`);
                    }
                  }}
                >
                  <div className="tarjeta-proyecto-cabecera">
                    <h3>{proyecto.nombre}</h3>
                    <button
                      className="boton-eliminar"
                      title="Eliminar proyecto"
                      onClick={(evento) => {
                        evento.stopPropagation();
                        manejarEliminacion(proyecto._id);
                      }}
                    >
                      Eliminar
                    </button>
                  </div>
                  <p className="tarjeta-proyecto-cliente">
                    {proyecto.cliente ? `Cliente: ${proyecto.cliente}` : 'Sin cliente'}
                  </p>
                  <div className="tarjeta-proyecto-pie">
                    <span className="fecha-creacion">{formatearFecha(proyecto.fechaCreacion)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}