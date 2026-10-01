type ElementoConPrefijos = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type DocumentoConPrefijos = Document & {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type OrientacionConBloqueo = ScreenOrientation & {
  lock?: (modo: string) => Promise<void>;
  unlock?: () => void;
};

/** Elemento que está a pantalla completa, contemplando prefijos antiguos. */
export function elementoEnPantallaCompleta(): Element | null {
  const documento = document as DocumentoConPrefijos;
  return (
    documento.fullscreenElement ??
    documento.webkitFullscreenElement ??
    documento.msFullscreenElement ??
    null
  );
}

/** Pide pantalla completa sobre un elemento; devuelve si se consiguió. */
export async function pedirPantallaCompleta(elemento: HTMLElement | null): Promise<boolean> {
  if (!elemento) {
    return false;
  }
  if (elementoEnPantallaCompleta()) {
    return true;
  }
  const conPrefijos = elemento as ElementoConPrefijos;
  try {
    if (elemento.requestFullscreen) {
      await elemento.requestFullscreen();
      return true;
    }
    if (conPrefijos.webkitRequestFullscreen) {
      await conPrefijos.webkitRequestFullscreen();
      return true;
    }
    if (conPrefijos.msRequestFullscreen) {
      await conPrefijos.msRequestFullscreen();
      return true;
    }
  } catch {
    // El navegador puede denegar la petición (gesto, permisos, iframe...).
  }
  return false;
}

/** Sale de la pantalla completa si se está dentro. */
export async function salirPantallaCompleta(): Promise<void> {
  const documento = document as DocumentoConPrefijos;
  try {
    if (documento.exitFullscreen) {
      await documento.exitFullscreen();
    } else if (documento.webkitExitFullscreen) {
      await documento.webkitExitFullscreen();
    } else if (documento.msExitFullscreen) {
      await documento.msExitFullscreen();
    }
  } catch {
    // Si el navegador ya salió, no hay nada que hacer.
  }
}

/** Intenta bloquear la orientación horizontal (suele requerir pantalla completa). */
export async function bloquearHorizontal(): Promise<void> {
  const orientacion = screen.orientation as OrientacionConBloqueo | undefined;
  try {
    await orientacion?.lock?.('landscape');
  } catch {
    // En escritorio o navegadores sin soporte el giro lo controla el usuario.
  }
}

/** Suelta el bloqueo de orientación si estaba activo. */
export function desbloquearOrientacion(): void {
  const orientacion = screen.orientation as OrientacionConBloqueo | undefined;
  try {
    orientacion?.unlock?.();
  } catch {
    // Sin bloqueo activo no hay nada que soltar.
  }
}

/**
 * Pide pantalla completa y, si se consigue, bloquea el horizontal.
 * Devuelve true si el elemento quedó a pantalla completa.
 */
export async function activarPantallaCompletaHorizontal(
  elemento: HTMLElement | null,
): Promise<boolean> {
  const enCompleta = await pedirPantallaCompleta(elemento);
  if (enCompleta) {
    await bloquearHorizontal();
  }
  return enCompleta;
}

/** Salir de pantalla completa y soltar el bloqueo de orientación. */
export async function desactivarPantallaCompletaHorizontal(): Promise<void> {
  await salirPantallaCompleta();
  desbloquearOrientacion();
}
