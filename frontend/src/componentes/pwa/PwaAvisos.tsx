import { useCallback, useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Modos de visualización que indican que la app corre instalada. */
const MODOS_INSTALADA = ['standalone', 'window-controls-overlay', 'fullscreen', 'minimal-ui'];

function estaInstalada(): boolean {
  const porModo = MODOS_INSTALADA.some((modo) =>
    window.matchMedia(`(display-mode: ${modo})`).matches,
  );
  const porIos = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return porModo || porIos;
}

function esIos(): boolean {
  const ua = window.navigator.userAgent;
  // iPadOS 13+ se identifica como Macintosh; se distingue por los puntos táctiles.
  const ipadComoMac = /Macintosh/i.test(ua) && window.navigator.maxTouchPoints > 1;
  return /iphone|ipad|ipod/i.test(ua) || ipadComoMac;
}

/**
 * Avisos de la PWA: registra el service worker y muestra el aviso de
 * instalación (mientras la app no esté instalada), el de actualización
 * disponible y el de uso sin conexión.
 */
export default function PwaAvisos(): JSX.Element | null {
  const [hayActualizacion, setHayActualizacion] = useState(false);
  const [listoOffline, setListoOffline] = useState(false);
  const [eventoInstalacion, setEventoInstalacion] = useState<EventoInstalacion | null>(null);
  const [instalada, setInstalada] = useState(() => estaInstalada());
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

  // El aviso de instalación se muestra siempre que la app no esté instalada.
  useEffect(() => {
    function alPoderInstalar(evento: Event): void {
      evento.preventDefault();
      setEventoInstalacion(evento as EventoInstalacion);
    }
    function alInstalarse(): void {
      setEventoInstalacion(null);
      setInstalada(true);
    }
    window.addEventListener('beforeinstallprompt', alPoderInstalar);
    window.addEventListener('appinstalled', alInstalarse);
    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar);
      window.removeEventListener('appinstalled', alInstalarse);
    };
  }, []);

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
      setEventoInstalacion(null);
      setInstalada(true);
    }
  }, [eventoInstalacion]);

  if (instalada && !hayActualizacion && !listoOffline) {
    return null;
  }

  const instruccion = eventoInstalacion
    ? 'Tenla a mano en el escritorio o en la pantalla de inicio, con acceso sin conexión.'
    : esIos()
      ? 'Toca «Compartir» y elige «Añadir a pantalla de inicio».'
      : 'Abre el menú del navegador y elige «Instalar aplicación» o «Añadir a pantalla de inicio».';

  return (
    <div className="pwa-avisos">
      {!instalada && (
        <div className="pwa-instalar" aria-label="Instalar GlassView">
          <img className="pwa-instalar-icono" src="/icons/pwa-192x192.png" alt="" />
          <div className="pwa-instalar-texto">
            <strong>Instala GlassView</strong>
            <span>{instruccion}</span>
          </div>
          {eventoInstalacion && (
            <button type="button" className="pwa-instalar-boton" onClick={() => void instalar()}>
              Instalar
            </button>
          )}
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
