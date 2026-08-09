import { useEffect, useState } from 'react';

const CLAVE_TEMA = 'glassview-tema';

export type Tema = 'claro' | 'oscuro';

export function obtenerTemaInicial(): Tema {
  if (typeof window === 'undefined') {
    return 'claro';
  }

  const guardado = localStorage.getItem(CLAVE_TEMA);
  if (guardado === 'claro' || guardado === 'oscuro') {
    return guardado;
  }

  const prefiereOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  return prefiereOscuro ? 'oscuro' : 'claro';
}

export function useTema() {
  const [tema, setTema] = useState<Tema>(obtenerTemaInicial);

  useEffect(() => {
    document.documentElement.dataset.tema = tema;
    localStorage.setItem(CLAVE_TEMA, tema);
  }, [tema]);

  function alternarTema(): void {
    setTema((temaActual) => (temaActual === 'claro' ? 'oscuro' : 'claro'));
  }

  return { tema, alternarTema };
}
