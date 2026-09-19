const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

const TAMANO = { viewBox: '0 0 24 24', width: 20, height: 20 } as const;

/** Detalle secundario (paredes interiores, brillos) del icono. */
const SUAVE = { ...TRAZO, strokeWidth: 1.3, opacity: 0.45 } as const;

/**
 * Icono SVG de una herramienta CAD o de plantillas, dibujado como la pieza
 * real que coloca (perfiles con su garganta de vidrio, herrajes, etc.).
 * Usa `currentColor` para heredar el color del botón que lo contiene.
 */
export default function IconoHerramienta({ id }: { id: string }): JSX.Element {
  switch (id) {
    case 'seleccion':
      return (
        <svg {...TAMANO}>
          <path d="M5 3l6.6 15.2 1.9-6.3 6.3-1.9z" fill="currentColor" />
        </svg>
      );
    case 'mano':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M7.6 12.3V8.6a1.2 1.2 0 0 1 2.4 0v2.9" />
          <path d="M10 11.5V6.8a1.2 1.2 0 0 1 2.4 0v4.2" />
          <path d="M12.4 11V7.4a1.2 1.2 0 0 1 2.4 0v3.8" />
          <path d="M14.8 11.3v-1.9a1.2 1.2 0 0 1 2.4 0v5.7a4.6 4.6 0 0 1-4.6 4.6h-1.5a4.2 4.2 0 0 1-3-1.2l-3.2-3.1a1.2 1.2 0 0 1 1.7-1.7l1.6 1.5" />
        </svg>
      );
    case 'vidrio':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <rect x="5" y="3.5" width="14" height="17" rx="1.2" />
          <path d="M8.6 20.5 13.4 3.5" {...SUAVE} />
          <path d="M12.4 20.5 17.2 3.5" {...SUAVE} />
        </svg>
      );
    case 'cabezal':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M3.5 4.5h17v5h-17z" />
          <path d="M9 9.5v2.4h6V9.5" />
          <path d="M8 4.5v5M16 4.5v5" {...SUAVE} />
        </svg>
      );
    case 'sillar':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M3.5 19.5h17v-5h-17z" />
          <path d="M9 14.5v-2.4h6v2.4" />
          <path d="M3.5 11.5h17" {...SUAVE} />
        </svg>
      );
    case 'jamba':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M4.5 3.5h5v17h-5z" />
          <path d="M9.5 9v6h2.4V9" />
          <path d="M4.5 8v8M9.5 8v8" {...SUAVE} />
        </svg>
      );
    case 'hoja':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M5 3.5v17M19 3.5v17" />
          <path d="M5 9h5.5v6H5" />
          <path d="M13.5 9H19v6h-5.5" />
        </svg>
      );
    case 'horizontal':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M3.5 10h17v4h-17z" />
          <path d="M9.5 14v2h5v-2" />
          <path d="M9.5 10v4M14.5 10v4" {...SUAVE} />
        </svg>
      );
    case 'riel':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M3.5 5.5h17v3.4h-17z" />
          <path d="M3.5 8.9v3.4h4.2V8.9M20.5 8.9v3.4h-4.2V8.9" />
          <circle cx="12" cy="17" r="3.2" />
          <circle cx="12" cy="17" r="1.2" {...SUAVE} />
        </svg>
      );
    case 'canal-u':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M6 3.5v12.3a4.2 4.2 0 0 0 4.2 4.2h3.6a4.2 4.2 0 0 0 4.2-4.2V3.5" />
          <path d="M8.7 3.5v11.6a2.3 2.3 0 0 0 2.3 2.3h2a2.3 2.3 0 0 0 2.3-2.3V3.5" {...SUAVE} />
        </svg>
      );
    case 'rodachina':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M6.5 3.5h11v4.2h-11z" />
          <path d="M12 7.7v2.1" />
          <circle cx="12" cy="15.2" r="5" />
          <circle cx="12" cy="15.2" r="1.7" {...SUAVE} />
        </svg>
      );
    case 'manija':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <rect x="9.6" y="3.5" width="4.8" height="7" rx="1.6" />
          <path d="M12 10.5v2.4" />
          <rect x="5.2" y="12.9" width="13.6" height="3.6" rx="1.8" />
        </svg>
      );
    case 'empaque':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <path d="M3.5 6.5h17" {...SUAVE} />
          <path d="M3.5 13c1.8 2.6 3.6 2.6 5.4 0s3.6-2.6 5.4 0 3.6 2.6 5.4 0" />
        </svg>
      );
    case 'plantillas':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <rect x="3.5" y="3.5" width="17" height="17" rx="1.4" />
          <path d="M12 3.5v17M3.5 12h17" />
          <path d="M8.5 6h7" {...SUAVE} />
        </svg>
      );
    case 'ayuda':
      return (
        <svg {...TAMANO} {...TRAZO}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1 .8-1 1.5v.4" />
          <path d="M12 16.8v.01" />
        </svg>
      );
    default:
      return (
        <svg {...TAMANO} {...TRAZO}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}
