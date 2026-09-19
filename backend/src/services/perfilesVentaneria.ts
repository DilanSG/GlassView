/**
 * Diccionario de perfiles y productos de ventanería extraído de
 * «descuentos de ventanería.xlsx» (hoja REFERENCIAS DE PERFILES + hojas de
 * modelos). Usado para la paleta CAD: al dibujar una pieza, el usuario elige
 * la REF dentro de las compatibles con su herramienta.
 *
 * `categoria` determina para qué herramienta aparece cada producto:
 *   vidrio    → rectángulo libre (ancho × alto)
 *   cabezal   → perfil horizontal superior
 *   sillar    → perfil horizontal inferior
 *   jamba     → perfil vertical
 *   enganche/traslape → perfil vertical de hoja
 *   horizontal → perfil horizontal de hoja
 *   riel      → línea horizontal (guías)
 *   canal-u   → canal perimetral
 *   rodachina → punto de inserción
 *   manija    → punto de inserción
 *   empaque   → línea aplicada sobre borde
 */

export interface PerfilVentaneria {
  ref: string;
  descripcion: string;
  categoria: PerfilCategoria;
  sistema: string;
  precioMetro?: number;
  precioTramo?: number;
}

export type PerfilCategoria =
  | 'vidrio'
  | 'cabezal'
  | 'sillar'
  | 'jamba'
  | 'hoja'
  | 'horizontal'
  | 'riel'
  | 'canal-u'
  | 'rodachina'
  | 'manija'
  | 'empaque'
  | 'tubo'
  | 'otro';

const p = (
  ref: string,
  descripcion: string,
  categoria: PerfilCategoria,
  sistema: string,
  precioMetro?: number,
  precioTramo?: number,
): PerfilVentaneria => ({
  ref,
  descripcion,
  categoria,
  sistema,
  precioMetro,
  precioTramo,
});

export function obtenerPerfilPorRef(ref: string): PerfilVentaneria | undefined {
  const exacta = perfilesVentaneria.find((perfil) => perfil.ref === ref);
  if (exacta) {
    return exacta;
  }
  return perfilesVentaneria.find((perfil) => perfil.ref.toLowerCase() === ref.toLowerCase());
}

export const perfilesVentaneria: PerfilVentaneria[] = [
  // ─────────────────────────── VIDRIOS ───────────────────────────
  p('VID-3', 'VIDRIO 3 MM', 'vidrio', 'VIDRIO', 2, 2),
  p('VID-4', 'VIDRIO 4 MM', 'vidrio', 'VIDRIO', 2.5, 2.5),
  p('VID-5', 'VIDRIO 5 MM', 'vidrio', 'VIDRIO', 2.5, 2.5),
  p('VID-6', 'VIDRIO 6 MM', 'vidrio', 'VIDRIO', 3, 3),
  p('ACR-4', 'ACRILICO 4 MM', 'vidrio', 'ACRILICO', 1000, 1000),

  // ─────────────────────────── 5020 ───────────────────────────
  p('ALNA-144', 'CABEZAL 5020', 'cabezal', '5020', 6320, 31600),
  p('ALNA-194', 'SILLAR 5020', 'sillar', '5020', 6860, 34300),
  p('ALNB-193', 'JAMBA 5020', 'jamba', '5020', 6260, 31300),
  p('ALNB-147', 'ENGANCHE 5020', 'hoja', '5020', 5460, 27300),
  p('ALNA-192', 'TRASLAPE 5020', 'hoja', '5020', 4060, 20300),
  p('ALNA-349', 'HORIZONTAL 5020', 'horizontal', '5020', 6360, 31800),
  p('ALN-581', 'SILLAR ALFAJIA', 'sillar', '5020', 10860, 54300),

  // ───────────────────────── 744 / 8025 ─────────────────────────
  p('ALN-392', 'CABEZAL 744-8025', 'cabezal', '744', 6940, 34700),
  p('ALN-387', 'SILLAR 744-8025', 'sillar', '744', 8220, 41100),
  p('ALN-393', 'JAMBA 744-8025', 'jamba', '744', 6680, 33400),
  p('ALN-391', 'ENGANCHE 744-8025', 'hoja', '744', 7640, 38200),
  p('ALN-388', 'TRASLAPE 744-8025', 'hoja', '744', 7220, 36100),
  p('ALN-389', 'HOR. SUPERIOR 744-8025', 'horizontal', '744', 5400, 27000),
  p('ALN-390', 'HOR. INFERIOR 744-8025', 'horizontal', '744', 7100, 35500),
  p('ALN-403', 'ADAPTADOR', 'tubo', '744', 3840, 19200),

  // ─────────────────────────── 8025 ───────────────────────────
  p('ALN-392-8025', 'CABEZAL 8025', 'cabezal', '8025', 10340, 51700),
  p('ALN-387-8025', 'SILLAR 8025', 'sillar', '8025', 10080, 50400),
  p('ALN-393-8025', 'JAMBA 8025', 'jamba', '8025', 9940, 49700),
  p('ALN-391-8025', 'ENGANCHE 8025', 'hoja', '8025', 10180, 50900),
  p('ALN-388-8025', 'TRASLAPE 8025', 'hoja', '8025', 10600, 53000),
  p('ALN-389-8025', 'HOR. SUPERIOR 8025', 'horizontal', '8025', 9220, 46100),
  p('ALN-390-8025', 'HOR. INFERIOR 8025', 'horizontal', '8025', 11920, 59600),
  p('ALN-403-8025', 'ADAPTADOR 8025', 'tubo', '8025', 4100, 20500),

  // ─────────────────────────── 7038 ───────────────────────────
  p('ALN-700', 'CABEZAL 7038', 'cabezal', '7038', 19560, 97800),
  p('ALN-775', 'SILLAR 7038', 'sillar', '7038', 20400, 102000),
  p('ALN-702', 'JAMBA 7038', 'jamba', '7038', 17600, 88000),
  p('ALN-705', 'ENGANCHE 7038', 'hoja', '7038', 26600, 133000),
  p('ALN-704', 'TRASLAPE 7038', 'hoja', '7038', 24000, 118300),
  p('ALN-703', 'HORIZONTAL 7038', 'horizontal', '7038', 22500, 118300),

  // ─────────────────────────── 3831 ───────────────────────────
  p('ALNA-A-173', 'CABEZAL SILLAR 3831', 'cabezal', '3831', 6320, 31600),
  p('ALN-A-174', 'JAMBA 3831', 'jamba', '3831', 6260, 31300),
  p('HSP-019', 'ADAPTADOR 7038', 'tubo', '3831', 10100, 50500),

  // ─────────────────────── P.B. TUBULAR ───────────────────────
  p('PU-057', 'U 2X1 SUPER CORRIDA', 'canal-u', 'P.B.', 8160, 40800),
  p('ALN-1101', 'TUBO 1 1/2 X 1 1/2', 'tubo', 'P.B.', 11200, 56000),
  p('ALN-1102', 'TUBO 3 X 1 1/2', 'tubo', 'P.B.', 17000, 85000),
  p('ALN-1175', 'ADAPTADOR P.B.', 'tubo', 'P.B.', 3840, 19200),

  // ─────────────── DIVISIONES DE BAÑO ACRILICO ───────────────
  p('CAB-ACR', 'CABEZAL ACRILICO', 'cabezal', 'ACR', 9540, 47700),
  p('RIEL-ACR', 'RIEL BAÑO', 'riel', 'ACR', 4780, 23900),
  p('JAMB-6', 'JAMBA 6 MT', 'jamba', 'ACR', 3680, 18400),
  p('U-LIV', 'U LIVIANA', 'canal-u', 'ACR', 3780, 18900),
  p('BAR-T', 'BARRA TOALLERO', 'otro', 'ACR', 2360, 11800),
  p('SOP-T', 'SOPORTE TOAL', 'otro', 'ACR', 1000, 1000),

  // ─────────────── RIELES / GUÍAS / PUNTOS ───────────────
  p('GUI-5020', 'GUIA 5020', 'riel', '5020', 1000, 1000),
  p('GUI-8025', 'GUIA 8025 INFERIOR', 'riel', '8025', 1000, 1000),
  p('GUI-8025-S', 'GUIA 8025 SUPERIOR', 'riel', '8025', 1000, 1000),
  p('GUI-7038', 'GUIA 7038', 'riel', '7038', 1000, 1000),
  p('ROD-5020', 'RODACHINA AMERICANA 5020', 'rodachina', '5020', 1000, 1000),
  p('ROD-8025', 'RODACHINA 8025 ACERO', 'rodachina', '8025', 1000, 1000),
  p('ROD-7038', 'RODACHINA 7038', 'rodachina', '7038', 1000, 1000),
  p('MAN-ALU', 'MANIJA ALUMINIO', 'manija', 'OTRO', 1000, 1000),
  p('SEG-PUNTO', 'SEGURO PUNTO ROJO', 'manija', '5020', 1000, 1000),
  p('SEG-JAG', 'SEGURO JAGUAR DOBLE', 'manija', '8025', 1000, 1000),
  p('SEG-OVS', 'SEGURO OVERSEA', 'manija', '7038', 1000, 1000),
  p('MAN-BASC', 'MANIA BASCULANTE', 'manija', '3831', 1000, 1000),

  // ───────────────────────── EMPAQUES ─────────────────────────
  p('FELPA', 'FELPA', 'empaque', 'OTRO', 150, 150),
  p('EMP-BUR', 'EMPAQUE BURBUJA', 'empaque', 'OTRO', 550, 550),
  p('EMP-EST', 'EMPAQUE ESTRELLITA', 'empaque', 'OTRO', 500, 500),
];