export type NombreIcono =
  | 'plano'
  | 'plantilla'
  | 'catalogo'
  | 'despiece'
  | 'proyectos'
  | 'pdf'
  | 'seguridad'
  | 'regla'
  | 'api';

/** Iconos de línea usados en la landing para ilustrar las características. */
export default function IconoCaracteristica({ nombre }: { nombre: NombreIcono }) {
  const comunes = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  } as const;

  switch (nombre) {
    case 'plano':
      return (
        <svg {...comunes}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 3v18" />
        </svg>
      );
    case 'plantilla':
      return (
        <svg {...comunes}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
          <path d="M17 13.5v7M13.5 17h7" />
        </svg>
      );
    case 'catalogo':
      return (
        <svg {...comunes}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12.5 9 5 9-5" />
          <path d="m3 16.5 9 5 9-5" />
        </svg>
      );
    case 'despiece':
      return (
        <svg {...comunes}>
          <path d="M4 6h16M4 12h16M4 18h9" />
          <path d="m16.5 16.5 2 2 4-4.5" />
        </svg>
      );
    case 'proyectos':
      return (
        <svg {...comunes}>
          <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
        </svg>
      );
    case 'pdf':
      return (
        <svg {...comunes}>
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
          <path d="M14 3v5h5" />
          <path d="M9 13h6M9 17h4" />
        </svg>
      );
    case 'seguridad':
      return (
        <svg {...comunes}>
          <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" />
          <path d="m9.5 12 1.8 1.8 3.4-3.6" />
        </svg>
      );
    case 'regla':
      return (
        <svg {...comunes}>
          <path d="m4 14.5 10.5-10.5 5.5 5.5L9.5 20 4 14.5Z" />
          <path d="m7.5 11 2 2M10.5 8l2 2M13.5 5l2 2" />
        </svg>
      );
    case 'api':
      return (
        <svg {...comunes}>
          <path d="m9 8-4 4 4 4M15 8l4 4-4 4" />
        </svg>
      );
  }
}
