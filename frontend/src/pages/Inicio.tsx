import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerPrecioSuscripcion } from '../api/clienteApi';
import BotonTema from '../components/BotonTema';
import IconoCaracteristica, { type NombreIcono } from '../components/IconoCaracteristica';
import PieDePagina from '../components/PieDePagina';
import { useSesion } from '../contextos/SesionContexto';
import type { PrecioSuscripcion } from '../tipos';
import { formatearMoneda } from '../utils/formato';
import { detectarPaisAproximado } from '../utils/pais';

interface Caracteristica {
  icono: NombreIcono;
  titulo: string;
  texto: string;
}

const CARACTERISTICAS: Caracteristica[] = [
  {
    icono: 'plano',
    titulo: 'Dibuja a escala real',
    texto: 'Traza cada pieza en centímetros con cotas exactas, sin hacer cuentas.',
  },
  {
    icono: 'plantilla',
    titulo: 'Plantillas de ventanería',
    texto: 'Elige un modelo y arma la ventana completa en segundos.',
  },
  {
    icono: 'despiece',
    titulo: 'Despiece y cotización al instante',
    texto: 'Perfiles, vidrio y herrajes calculados y convertidos en presupuesto.',
  },
  {
    icono: 'pdf',
    titulo: 'PDF listo para obra',
    texto: 'Exporta el plano con cotas para imprimir o compartir con tu cliente.',
  },
];

const PASOS: Array<{ titulo: string; texto: string }> = [
  { titulo: 'Crea tu cuenta', texto: 'Regístrate gratis, sin tarjeta.' },
  { titulo: 'Dibuja el plano', texto: 'Arma la ventana con plantillas o a mano.' },
  { titulo: 'Exporta y cotiza', texto: 'Descarga el PDF y el despiece.' },
];

const INCLUYE: string[] = [
  'Planos y proyectos ilimitados',
  'Despiece y precios automáticos',
  'PDF con cotas reales',
  'Mejoras y soporte incluidos',
];

export default function Inicio() {
  const { usuario } = useSesion();
  const [precio, setPrecio] = useState<PrecioSuscripcion | null>(null);
  const [cargandoPrecio, setCargandoPrecio] = useState(true);

  useEffect(() => {
    const pais = detectarPaisAproximado();
    obtenerPrecioSuscripcion(pais || undefined)
      .then(setPrecio)
      .catch(() => setPrecio(null))
      .finally(() => setCargandoPrecio(false));
  }, []);

  const diasPrueba = precio?.diasPrueba ?? 10;
  const precioLocal = precio
    ? formatearMoneda(precio.precioLocal, precio.moneda, precio.locale)
    : null;

  return (
    <div className="landing">
      <header className="barra-publica">
        <Link to="/" className="marca-publica">
          <img src="/icono.png" alt="" className="marca-logo" />
          GlassView
        </Link>

        <div className="acciones-publicas">
          {usuario ? (
            <Link to="/proyectos" className="boton-cta boton-cta-pequeno">
              Ir a la app
            </Link>
          ) : (
            <>
              <Link to="/acceso" className="boton-secundario boton-publico">
                Ingresar
              </Link>
              <Link to="/registro" className="boton-cta boton-cta-pequeno">
                Registrarse
              </Link>
            </>
          )}
          <BotonTema />
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-contenido">
            <h1 className="hero-titulo">
              Planos y despiece de cristalería,{' '}
              <span className="hero-titulo-acento">listos para cotizar</span>
            </h1>
            <p className="hero-texto">
              Dibuja tu ventana a escala real y obtén el despiece y el PDF con cotas en minutos.
            </p>
            <div className="hero-acciones">
              <Link to="/registro" className="boton-cta">
                Empezar gratis
              </Link>
            </div>
            <ul className="hero-puntos">
              <li>Prueba de {diasPrueba} días</li>
              <li>Sin tarjeta</li>
              <li>Escala real</li>
            </ul>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <img src="/icono.png" alt="" className="hero-icono" />
          </div>
        </section>

        <section id="caracteristicas" className="seccion">
          <header className="seccion-cabecera">
            <h2>Todo para cotizar más rápido</h2>
          </header>

          <div className="rejilla-caracteristicas">
            {CARACTERISTICAS.map((caracteristica) => (
              <article key={caracteristica.titulo} className="tarjeta-caracteristica">
                <span className="caracteristica-icono">
                  <IconoCaracteristica nombre={caracteristica.icono} />
                </span>
                <h3>{caracteristica.titulo}</h3>
                <p>{caracteristica.texto}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="seccion seccion-alterna">
          <header className="seccion-cabecera">
            <h2>De la medida al presupuesto en tres pasos</h2>
          </header>

          <ol className="rejilla-pasos">
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo} className="paso">
                <span className="paso-numero">{indice + 1}</span>
                <h3>{paso.titulo}</h3>
                <p>{paso.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="precios" className="seccion-precios">
          <header className="seccion-cabecera seccion-cabecera-centrada">
            <h2>Un plan para tu taller</h2>
          </header>

          <div className="precio-tarjeta">
            <span className="badge-popular">Plan único</span>
            <h3>GlassView Pro</h3>
            <p className="precio-descripcion">Todas las funciones, un solo precio.</p>

            <div className="precio-valor">
              {cargandoPrecio ? (
                <span className="precio-cargando">Calculando…</span>
              ) : (
                <span className="precio-local">{precioLocal ?? '—'}</span>
              )}
              <span className="precio-periodo">/ mes</span>
            </div>

            <ul className="precio-lista">
              {INCLUYE.map((beneficio) => (
                <li key={beneficio}>{beneficio}</li>
              ))}
            </ul>

            <Link to="/registro" className="boton-cta boton-cta-ancho">
              Empezar prueba de {diasPrueba} días
            </Link>
            <p className="precio-nota">Sin tarjeta. Cancela cuando quieras.</p>
          </div>
        </section>

        <section className="cta-final">
          <h2>Empieza a cotizar más rápido hoy mismo</h2>
          <p>Crea tu cuenta y dibuja tu primer plano en minutos.</p>
          <Link to="/registro" className="boton-cta">
            Crear cuenta gratis
          </Link>
        </section>
      </main>

      <PieDePagina />
    </div>
  );
}
