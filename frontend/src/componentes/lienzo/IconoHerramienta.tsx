const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

/**
 * Icono SVG de una herramienta CAD o de plantillas.
 * Usa `currentColor` para heredar el color del botón que lo contiene.
 */
export default function IconoHerramienta({ id }: { id: string }): JSX.Element {
  switch (id) {
    case 'seleccion':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z" fill="currentColor" />
        </svg>
      );
    case 'mano':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M12 3v18M3 12h18" />
          <path d="M8 8l4-4 4 4M8 16l4 4 4-4" />
        </svg>
      );
    case 'vidrio':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <rect x="4" y="4" width="16" height="16" rx="1.5" />
          <path d="M4 4l16 16" opacity="0.35" />
        </svg>
      );
    case 'cabezal':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M4 4h16" />
          <path d="M4 4v4" />
          <path d="M20 4v4" />
        </svg>
      );
    case 'sillar':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M4 20h16" />
          <path d="M4 20v-4" />
          <path d="M20 20v-4" />
        </svg>
      );
    case 'jamba':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M6 4v16" />
          <path d="M6 4h4" />
          <path d="M6 20h4" />
        </svg>
      );
    case 'hoja':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M9 4v16M15 4v16" />
          <path d="M9 8h6M9 16h6" />
        </svg>
      );
    case 'horizontal':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M4 12h16" />
          <path d="M4 9v6M20 9v6" />
        </svg>
      );
    case 'riel':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M3 10h18M5 15h14" />
          <circle cx="12" cy="10" r="1.4" />
        </svg>
      );
    case 'canal-u':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M6 4v13a3 3 0 003 3h6a3 3 0 003-3V4" />
        </svg>
      );
    case 'rodachina':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.2" />
        </svg>
      );
    case 'manija':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <rect x="10" y="3" width="4" height="10" rx="2" />
          <circle cx="12" cy="16.5" r="4.5" />
        </svg>
      );
    case 'empaque':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M3 12c2 3.5 4 3.5 6 0s4-3.5 6 0 4 3.5 6 0" />
        </svg>
      );
    case 'plantillas':
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 13l9 5 9-5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" width="18" height="18" {...TRAZO}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}