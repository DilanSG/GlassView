import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { eliminarProyecto, obtenerProyectos } from '../api/clienteApi';
import type { PiezaPlano, Proyecto } from '../tipos';

function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function esPiezaVidrio(pieza: PiezaPlano): boolean {
  return (
    /vidrio/i.test(pieza.tipo) ||
    /vid/i.test(pieza.ref) ||
    /vidrio/i.test(pieza.descripcion)
  );
}

interface ResumenProyecto {
  totalPiezas: number;
  vidrios: number;
  perfiles: number;
  metrosLineales: number;
  areaVidrioM2: number;
}

function calcularResumen(piezas: PiezaPlano[]): ResumenProyecto {
  let vidrios = 0;
  let unidades = 0;
  let metrosLineales = 0;
  let areaVidrioM2 = 0;

  for (const pieza of piezas) {
    const cantidad = pieza.cantidad || 1;
    unidades += cantidad;

    if (esPiezaVidrio(pieza)) {
      vidrios += cantidad;
      areaVidrioM2 += ((pieza.anchoCm || 0) * (pieza.altoCm || 0)) / 10000 * cantidad;
    } else {
      metrosLineales += ((pieza.largoCm || 0) / 100) * cantidad;
    }
  }

  return {
    totalPiezas: piezas.length,
    vidrios,
    perfiles: unidades - vidrios,
    metrosLineales,
    areaVidrioM2,
  };
}

function MiniaturaPlano({ piezas }: { piezas: PiezaPlano[] }) {
  if (piezas.length === 0) {
    return (
      <div className="miniatura-plano">
        <span className="miniatura-plano-vacio">Sin piezas aún</span>
      </div>
    );
  }

  const margen = 24;
  const extremos = (pieza: PiezaPlano) =>
    esPiezaVidrio(pieza)
      ? {
          x0: pieza.x,
          y0: pieza.y,
          x1: pieza.x + (pieza.anchoCm || pieza.largoCm),
          y1: pieza.y + (pieza.altoCm || pieza.largoCm),
        }
      : pieza.orientacion === 'vertical'
        ? { x0: pieza.x, y0: pieza.y, x1: pieza.x, y1: pieza.y + (pieza.largoCm || pieza.altoCm) }
        : pieza.orientacion === 'punto'
          ? { x0: pieza.x - 3, y0: pieza.y - 3, x1: pieza.x + 3, y1: pieza.y + 3 }
          : { x0: pieza.x, y0: pieza.y, x1: pieza.x + (pieza.largoCm || pieza.anchoCm), y1: pieza.y };

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const pieza of piezas) {
    const { x0, y0, x1, y1 } = extremos(pieza);
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  }

  const ancho = maxX - minX;
  const alto = maxY - minY;
  const grosorLinea = Math.max(2.5, Math.min(ancho, alto) / 50);

  return (
    <div className="miniatura-plano">
      <svg
        viewBox={`${minX - margen} ${minY - margen} ${ancho + margen * 2} ${alto + margen * 2}`}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {piezas.map((pieza) => {
          const { x0, y0, x1, y1 } = extremos(pieza);

          if (esPiezaVidrio(pieza)) {
            return (
              <rect
                key={pieza.id}
                x={x0}
                y={y0}
                width={Math.max(x1 - x0, 2)}
                height={Math.max(y1 - y0, 2)}
                rx={Math.min(ancho, alto) / 28}
                className="miniatura-vidrio"
              />
            );
          }

          if (pieza.orientacion === 'punto') {
            return (
              <circle key={pieza.id} cx={pieza.x} cy={pieza.y} r={grosorLinea} className="miniatura-perfil" />
            );
          }

          return (
            <line
              key={pieza.id}
              x1={x0}
              y1={y0}
              x2={x1}
              y2={y1}
              strokeWidth={grosorLinea}
              className="miniatura-perfil"
            />
          );
        })}
      </svg>
    </div>
  );
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
            {proyectos.map((proyecto, indice) => {
              const resumen = calcularResumen(proyecto.piezas);
              const esDestacada = indice === 0;
              const esAncha = indice === 1;
              const clasesCelda = [
                'celda-bento',
                esDestacada ? 'celda-destacada' : '',
                esAncha ? 'celda-ancha' : '',
              ]
                .filter(Boolean)
                .join(' ');
              const clasesTarjeta = [
                'tarjeta-proyecto',
                esDestacada ? 'tarjeta-destacada' : '',
                esAncha ? 'tarjeta-horizontal' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <li key={proyecto._id} className={clasesCelda}>
                  <article
                    className={clasesTarjeta}
                    onClick={() => navegar(`/proyectos/${proyecto._id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(evento) => {
                      if (evento.key === 'Enter') {
                        navegar(`/proyectos/${proyecto._id}`);
                      }
                    }}
                  >
                    <div className="miniatura-plano-contenedor">
                      {esDestacada && <span className="badge-reciente">Más reciente</span>}
                      <MiniaturaPlano piezas={proyecto.piezas} />
                    </div>

                    <div className="tarjeta-proyecto-cuerpo">
                      <div className="tarjeta-proyecto-cabecera">
                        <h3 className="tarjeta-proyecto-titulo">{proyecto.nombre}</h3>
                        <button
                          className="boton-eliminar"
                          title="Eliminar proyecto"
                          aria-label={`Eliminar ${proyecto.nombre}`}
                          onClick={(evento) => {
                            evento.stopPropagation();
                            manejarEliminacion(proyecto._id);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>

                      <p className="tarjeta-proyecto-cliente">
                        {proyecto.cliente ? `${proyecto.cliente}` : 'Sin cliente asignado'}
                      </p>

                      <div className="chips-stats">
                        <span className="chip">
                          {resumen.totalPiezas} {resumen.totalPiezas === 1 ? 'pieza' : 'piezas'}
                        </span>
                        {resumen.perfiles > 0 && (
                          <span className="chip">{resumen.perfiles} perfiles</span>
                        )}
                        {resumen.vidrios > 0 && (
                          <span className="chip">{resumen.vidrios} vidrios</span>
                        )}
                        {resumen.metrosLineales > 0 && (
                          <span className="chip">{resumen.metrosLineales.toFixed(1)} m</span>
                        )}
                        {resumen.areaVidrioM2 > 0 && (
                          <span className="chip">{resumen.areaVidrioM2.toFixed(2)} m²</span>
                        )}
                      </div>

                      <div className="tarjeta-proyecto-pie">
                        <span className="fecha-creacion">{formatearFecha(proyecto.fechaCreacion)}</span>
                        <span className="abrir-proyecto">Abrir plano →</span>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}