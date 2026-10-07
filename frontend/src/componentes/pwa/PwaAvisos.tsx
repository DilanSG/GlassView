import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Clave donde se recuerda que el usuario no quiere ver el aviso de instalación. */
const CLAVE_DESCARTE = 'glassview:instalacion-descartada';

function enIos(): boolean {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function yaInstalada(): boolean {
  const enModoApp = window.matchMedia('(display-mode: standalone)').matches;
  const enIos = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return enModoApp || enIos;
}

/**
 * Avisos de la PWA: registra el service worker y muestra los avisos de
 * actualización, uso sin conexión e instalación en el dispositivo.
 */
export default function PwaAvisos(): JSX.Element | null {
  const [hayActualizacion, setHayActualizacion] = useState(false);
  const [listoOffline, setListoOffline] = useState(false);
  const [eventoInstalacion, setEventoInstalacion] = useState<EventoInstalacion | null>(null);
  const [ayudaIos, setAyudaIos] = useState(false);
  const actualizarRef = useRef<((recargar?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    actualizarRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setHayActualizacion(true);
      },
      onOfflineReady() {
        setListoOffline(true);
      },
      onRegisteredSW(_url, registro) {
        if (!registro) {
          return;
        }
        // Revisa si hay versiones nuevas mientras la aplicación sigue abierta.
        window.setInterval(() => {
          void registro.update();
        }, 60 * 60 * 1000);
      },
    });
  }, []);

  useEffect(() => {
    function alPoderInstalar(evento: Event): void {
      evento.preventDefault();
      if (localStorage.getItem(CLAVE_DESCARTE) === '1') {
        return;
      }
      setEventoInstalacion(evento as EventoInstalacion);
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    return () => window.removeEventListener('beforeinstallprompt', alPoderInstalar);
  }, []);

  useEffect(() => {
    // iOS no avisa con beforeinstallprompt: se muestra una ayuda breve.
    if (yaInstalada() || localStorage.getItem(CLAVE_DESCARTE) === '1' || !enIos()) {
      return;
    }
    const temporizador = window.setTimeout(() => setAyudaIos(true), 4000);
    return () => window.clearTimeout(temporizador);
  }, []);

  useEffect(() => {
    if (!listoOffline) {
      return;
    }
    const temporizador = window.setTimeout(() => setListoOffline(false), 5000);
    return () => window.clearTimeout(temporizador);
  }, [listoOffline]);

  const instalar = useCallback(async (): Promise<void> => {
    if (!eventoInstalacion) {
      return;
    }
    await eventoInstalacion.prompt();
    const eleccion = await eventoInstalacion.userChoice;
    if (eleccion.outcome === 'dismissed') {
      localStorage.setItem(CLAVE_DESCARTE, '1');
    }
    setEventoInstalacion(null);
  }, [eventoInstalacion]);

  function descartarInstalacion(): void {
    localStorage.setItem(CLAVE_DESCARTE, '1');
    setEventoInstalacion(null);
    setAyudaIos(false);
  }

  const mostrarInstalacion = Boolean(eventoInstalacion) || ayudaIos;
  if (!hayActualizacion && !listoOffline && !mostrarInstalacion) {
    return null;
  }

  return (
    <div className="pwa-avisos" role="status" aria-live="polite">
      {hayActualizacion && (
        <div className="pwa-aviso">
          <div className="pwa-aviso-texto">
            <strong>Nueva versión disponible</strong>
            <span>Actualiza para aplicar las últimas mejoras.</span>
          </div>
          <div className="pwa-aviso-acciones">
            <button
              type="button"
              className="boton-primario"
              onClick={() => void actualizarRef.current?.(true)}
            >
              Actualizar
            </button>
            <button
              type="button"
              className="pwa-aviso-cerrar"
              aria-label="Recordar más tarde"
              title="Recordar más tarde"
              onClick={() => setHayActualizacion(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {eventoInstalacion && (
        <div className="pwa-aviso">
          <div className="pwa-aviso-texto">
            <strong>Instala GlassView</strong>
            <span>Tenla a mano en el escritorio o en la pantalla de inicio.</span>
          </div>
          <div className="pwa-aviso-acciones">
            <button type="button" className="boton-primario" onClick={() => void instalar()}>
              Instalar
            </button>
            <button
              type="button"
              className="pwa-aviso-cerrar"
              aria-label="No volver a mostrar"
              title="No volver a mostrar"
              onClick={descartarInstalacion}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {ayudaIos && !eventoInstalacion && (
        <div className="pwa-aviso">
          <div className="pwa-aviso-texto">
            <strong>Instálala en tu iPhone o iPad</strong>
            <span>Toca «Compartir» y elige «Añadir a pantalla de inicio».</span>
          </div>
          <div className="pwa-aviso-acciones">
            <button
              type="button"
              className="pwa-aviso-cerrar"
              aria-label="Entendido"
              title="Entendido"
              onClick={descartarInstalacion}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {listoOffline && (
        <div className="pwa-aviso pwa-aviso-offline">
          <div className="pwa-aviso-texto">
            <strong>Lista para abrir sin conexión</strong>
            <span>La app ya se abre sin internet; tus proyectos se cargan al volver la conexión.</span>
          </div>
        </div>
      )}
    </div>
  );
}
