import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { resaltar } from '../../utils/resaltar';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Modos de visualización que indican que la app corre instalada. */
const MODOS_INSTALADA = ['standalone', 'window-controls-overlay', 'fullscreen', 'minimal-ui'];
/** Recuerda que la app se instaló desde este navegador. */
const CLAVE_INSTALADA = 'glassview:app-instalada';
/** Recuerda que el usuario ocultó el aviso de instalación. */
const CLAVE_DESCARTE = 'glassview:instalar-descartado';

function enModoInstalado(): boolean {
  const porModo = MODOS_INSTALADA.some((modo) =>
    window.matchMedia(`(display-mode: ${modo})`).matches,
  );
  const porIos = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return porModo || porIos;
}

function estaInstalada(): boolean {
  return localStorage.getItem(CLAVE_INSTALADA) === '1' || enModoInstalado();
}

function esIos(): boolean {
  const ua = window.navigator.userAgent;
  // iPadOS 13+ se identifica como Macintosh; se distingue por los puntos táctiles.
  const ipadComoMac = /Macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || ipadComoMac;
}

/**
 * Avisos de la PWA: registra el service worker y muestra el aviso de
 * instalación (mientras la app no esté instalada o no se haya ocultado), el de
 * actualización disponible y el de uso sin conexión.
 */
export default function PwaAvisos(): JSX.Element | null {
  const [hayActualizacion, setHayActualizacion] = useState(false);
  const [listoOffline, setListoOffline] = useState(false);
  const [eventoInstalacion, setEventoInstalacion] = useState<EventoInstalacion | null>(null);
  const [instalada, setInstalada] = useState(() => estaInstalada());
  const [descartado, setDescartado] = useState(
    () => localStorage.getItem(CLAVE_DESCARTE) === '1',
  );
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

  /** Marca la app como instalada y oculta el aviso. */
  const marcarInstalada = useCallback((): void => {
    localStorage.setItem(CLAVE_INSTALADA, '1');
    setEventoInstalacion(null);
    setInstalada(true);
  }, []);

  useEffect(() => {
    function alPoderInstalar(evento: Event): void {
      evento.preventDefault();
      setEventoInstalacion(evento as EventoInstalacion);
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', marcarInstalada);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', marcarInstalada);
    };
  }, [marcarInstalada]);

  // Chrome puede confirmar que la PWA ya está instalada en el dispositivo.
  useEffect(() => {
    const nav = window.navigator as Navigator & {
      getInstalledRelatedApps?: () => Promise<unknown[]>;
    };
    if (!nav.getInstalledRelatedApps) {
      return;
    }
    let vigente = true;
    nav
      .getInstalledRelatedApps()
      .then((apps) => {
        if (vigente && apps.length > 0) {
          marcarInstalada();
        }
      })
      .catch(() => {
        // Sin permiso o sin soporte: se mantiene la detección por modo.
      });
    return () => {
      vigente = false;
    };
  }, [marcarInstalada]);

  // Al abrirse desde el icono instalado, el aviso desaparece.
  useEffect(() => {
    const consultas = MODOS_INSTALADA.map((modo) =>
      window.matchMedia(`(display-mode: ${modo})`),
    );
    function alCambiar(): void {
      setInstalada(estaInstalada());
    }
    consultas.forEach((consulta) => consulta.addEventListener('change', alCambiar));
    return () =>
      consultas.forEach((consulta) => consulta.removeEventListener('change', alCambiar));
  }, []);

  useEffect(() => {
    if (!listoOffline) {
      return;
    }
    const temporizador = window.setTimeout(() => setListoOffline(false), 6000);
    return () => window.clearTimeout(temporizador);
  }, [listoOffline]);

  const instalar = useCallback(async (): Promise<void> => {
    if (!eventoInstalacion) {
      return;
    }
    await eventoInstalacion.prompt();
    const eleccion = await eventoInstalacion.userChoice;
    if (eleccion.outcome === 'accepted') {
      marcarInstalada();
    }
  }, [eventoInstalacion, marcarInstalada]);

  /** Oculta el aviso de instalación de forma permanente. */
  function descartarInstalacion(): void {
    localStorage.setItem(CLAVE_DESCARTE, '1');
    setDescartado(true);
  }

  const mostrarInstalacion = !instalada && !descartado;
  if (!mostrarInstalacion && !hayActualizacion && !listoOffline) {
    return null;
  }

  const instruccion = eventoInstalacion
    ? 'Tenla a mano en el escritorio o en la pantalla de inicio, con acceso sin conexión.'
    : esIos()
      ? 'Toca «Compartir» y elige «Añadir a pantalla de inicio».'
      : 'Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».';

  return (
    <div className="pwa-avisos">
      {mostrarInstalacion && (
        <div className="pwa-instalar" aria-label="Instalar GlassView">
          <img className="pwa-instalar-icono" src="/icons/pwa-192x192.png" alt="" />
          <div className="pwa-instalar-texto">
            <strong>Instala GlassView</strong>
            <span>{resaltar(instruccion, 'instalar')}</span>
          </div>
          {eventoInstalacion && (
            <button type="button" className="pwa-instalar-boton" onClick={() => void instalar()}>
              Instalar
            </button>
          )}
          <button
            type="button"
            className="pwa-instalar-cerrar"
            aria-label="Ocultar el aviso de instalación"
            title="No volver a mostrar"
            onClick={descartarInstalacion}
          >
            ×
          </button>
        </div>
      )}

      {hayActualizacion && (
        <div className="pwa-aviso" role="status">
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

      {listoOffline && (
        <div className="pwa-aviso pwa-aviso-offline" role="status">
          <div className="pwa-aviso-texto">
            <strong>Lista para abrir sin conexión</strong>
            <span>La app ya se abre sin internet; tus proyectos se cargan al volver la conexión.</span>
          </div>
        </div>
      )}
    </div>
  );
}
