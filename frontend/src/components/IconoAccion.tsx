export type NombreAccion = 'panel' | 'descargar' | 'ojo' | 'lapiz';

/** Iconos de las acciones del editor (piezas, descargar, vista, editar). */
export default function IconoAccion({ nombre }: { nombre: NombreAccion }): JSX.Element {
  const comunes = {
    viewBox: '0 0 24 24',
    width: 19,
    height: 19,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;

  switch (nombre) {
    case 'panel':
      return (
        <svg {...comunes}>
          <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
          <path d="M14.5 4.5v15" />
          <path d="M17 9.5h1M17 12h1M17 14.5h1" opacity="0.5" />
        </svg>
      );
    case 'descargar':
      return (
        <svg {...comunes}>
          <path d="M12 4v10" />
          <path d="m8 10.5 4 4 4-4" />
          <path d="M5 19.5h14" />
        </svg>
      );
    case 'ojo':
      return (
        <svg {...comunes}>
          <path d="M3 12c0-1.5 4-6 9-6s9 4.5 9 6-4 6-9 6-9-4.5-9-6Z" />
          <circle cx="12" cy="12" r="2.6" />
        </svg>
      );
    case 'lapiz':
      return (
        <svg {...comunes}>
          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
          <path d="m13.5 6.5 4 4" />
        </svg>
      );
  }
}
