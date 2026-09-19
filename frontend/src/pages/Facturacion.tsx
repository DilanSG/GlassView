import { useEffect, useState } from 'react';
import { obtenerPrecioSuscripcion, pagarSuscripcion } from '../api/clienteApi';
import { useSesion } from '../contextos/SesionContexto';
import type { PrecioSuscripcion } from '../tipos';
import { formatearFecha, formatearMoneda } from '../utils/formato';
import { detectarPaisAproximado } from '../utils/pais';

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

function diasRestantes(fechaLimite: string | null): number {
  if (!fechaLimite) {
    return 0;
  }
  const diferencia = new Date(fechaLimite).getTime() - Date.now();
  return Math.max(0, Math.ceil(diferencia / MILISEGUNDOS_DIA));
}

export default function Facturacion() {
  const { usuario, actualizarUsuario } = useSesion();
  const [precio, setPrecio] = useState<PrecioSuscripcion | null>(null);
  const [cargandoPrecio, setCargandoPrecio] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const suscripcionActiva = usuario?.estado.suscripcionActiva ?? false;
  const paisDetectado = usuario?.pais ?? (detectarPaisAproximado() || undefined);

  useEffect(() => {
    if (!usuario || suscripcionActiva) {
      setPrecio(null);
      setCargandoPrecio(false);
      return;
    }

    let vigente = true;
    setCargandoPrecio(true);
    obtenerPrecioSuscripcion(paisDetectado)
      .then((datos) => {
        if (vigente) {
          setPrecio(datos);
        }
      })
      .catch(() => {
        if (vigente) {
          setPrecio(null);
        }
      })
      .finally(() => {
        if (vigente) {
          setCargandoPrecio(false);
        }
      });

    return () => {
      vigente = false;
    };
  }, [usuario?._id, suscripcionActiva, paisDetectado]);

  if (!usuario) {
    return null;
  }

  const { estado } = usuario;
  const precioLocal = precio
    ? formatearMoneda(precio.precioLocal, precio.moneda, precio.locale)
    : '—';

  async function manejarPago(): Promise<void> {
    setProcesando(true);
    setError('');
    setMensaje('');
    try {
      const actualizado = await pagarSuscripcion(paisDetectado);
      actualizarUsuario(actualizado);
      setMensaje(
        actualizado.estado.suscripcionActiva
          ? 'Suscripción renovada por 30 días.'
          : 'La suscripción se activó correctamente.',
      );
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo procesar el pago.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="pantalla pantalla-angosta">
      <header className="pagina-cabecera">
        <h2>Facturación</h2>
        <p>Consulta tu plan, tus renovaciones y tus facturas.</p>
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

      <section className="panel-plan">
        {suscripcionActiva ? (
          <>
            <div className="panel-plan-fila">
              <div>
                <span className="etiqueta-plan">Plan actual</span>
                <h3>
                  GlassView Pro
                  <span className="chip-plan chip-plan-suscripcion">Activa</span>
                </h3>
                <p className="panel-plan-detalle">
                  Se renueva el {formatearFecha(estado.suscripcionHasta)} ·{' '}
                  {diasRestantes(estado.suscripcionHasta)} días restantes
                </p>
              </div>

              <button
                type="button"
                className="boton-secundario"
                onClick={manejarPago}
                disabled={procesando}
              >
                {procesando ? 'Procesando…' : 'Renovar 30 días'}
              </button>
            </div>

            <dl className="datos-cuenta">
              <div>
                <dt>Inicio de la suscripción</dt>
                <dd>{formatearFecha(usuario.suscripcion.fechaInicio)}</dd>
              </div>
              <div>
                <dt>Próxima renovación</dt>
                <dd>{formatearFecha(estado.suscripcionHasta)}</dd>
              </div>
              <div>
                <dt>Último pago</dt>
                <dd>{formatearFecha(usuario.suscripcion.ultimoPago)}</dd>
              </div>
              <div>
                <dt>Correo de facturación</dt>
                <dd>{usuario.email}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <div className="panel-plan-fila">
              <div>
                <span className="etiqueta-plan">
                  {estado.motivo === 'prueba'
                    ? 'Prueba gratuita'
                    : estado.motivo === 'expirado'
                      ? 'Suscripción'
                      : 'Cuenta bloqueada'}
                </span>
                <h3>
                  {estado.motivo === 'prueba'
                    ? `Te quedan ${estado.diasPruebaRestantes} días`
                    : estado.motivo === 'expirado'
                      ? 'Activa tu plan para continuar'
                      : 'Contacta con soporte'}
                </h3>
                <p className="panel-plan-detalle">
                  {estado.motivo === 'prueba'
                    ? `Tu prueba termina el ${formatearFecha(estado.pruebaHasta)}.`
                    : estado.motivo === 'expirado'
                      ? `Tu prueba terminó el ${formatearFecha(estado.pruebaHasta)}. Reactiva tus planos y el despiece con la suscripción.`
                      : 'Tu cuenta está bloqueada y no puede activar la suscripción.'}
                </p>
              </div>

              <div className="panel-plan-precio">
                <div className="precio-valor">
                  {cargandoPrecio ? (
                    <span className="precio-cargando">Calculando…</span>
                  ) : (
                    <span className="precio-local">{precioLocal}</span>
                  )}
                  <span className="precio-periodo">/ mes</span>
                </div>

                <button
                  type="button"
                  className="boton-cta"
                  onClick={manejarPago}
                  disabled={procesando || estado.motivo === 'bloqueado'}
                >
                  {procesando ? 'Procesando pago…' : 'Activar suscripción'}
                </button>
              </div>
            </div>

            <ul className="precio-lista">
              <li>Planos y proyectos ilimitados</li>
              <li>Catálogo completo y despiece automático</li>
              <li>Exportación a PDF con cotas</li>
            </ul>

            <p className="nota-pago">
              Pago simulado en este entorno: la pasarela real se conectará en el mismo punto del
              backend sin cambiar la experiencia.
            </p>
          </>
        )}
      </section>

      <section className="panel-facturas">
        <header className="panel-facturas-cabecera">
          <h3>Facturas</h3>
          {usuario.pagos.length > 0 && (
            <span className="subtitulo-contador">
              {usuario.pagos.length} {usuario.pagos.length === 1 ? 'factura' : 'facturas'}
            </span>
          )}
        </header>

        {usuario.pagos.length === 0 ? (
          <p className="panel-facturas-vacio">Todavía no hay facturas.</p>
        ) : (
          <ul className="lista-facturas">
            <li className="factura-cabecera" aria-hidden="true">
              <span>Fecha</span>
              <span>Referencia</span>
              <span className="factura-importe">Importe</span>
              <span>Estado</span>
            </li>
            {usuario.pagos
              .slice()
              .reverse()
              .map((pago) => (
                <li key={pago.referencia}>
                  <span className="factura-fecha">{formatearFecha(pago.fecha)}</span>
                  <span className="factura-ref celda-mono">{pago.referencia}</span>
                  <span className="factura-importe">
                    {formatearMoneda(pago.montoLocal, pago.moneda, precio?.locale)}
                  </span>
                  <span className="chip-pagado">Pagada</span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
