import { a, h, p, v } from './tipos.js';
import type { AccesorioModelo, ModeloVentaneria } from './tipos.js';

const accesorios5020 = (hojas: number): AccesorioModelo[] => [
  { seccion: 'TORNILLERIA', descripcion: '8 X 3/4¨', cantidad: 8 * hojas },
  { seccion: 'TORNILLERIA', descripcion: '8 X 1/2¨', cantidad: 8 },
  { seccion: 'TORNILLERIA', descripcion: '8 X 1¨', cantidad: 4 },
  { seccion: 'REMACHES', descripcion: '4 - 2´', cantidad: 2 },
  { seccion: 'RODACHINAS', descripcion: 'AMERICANAS 5020', cantidad: 2 },
  { seccion: 'CHAZOS', descripcion: '0.25', cantidad: 4 },
  { seccion: 'GUIAS', descripcion: '5020', cantidad: 4 },
  { seccion: 'SEGURO', descripcion: 'PUNTO ROJO', cantidad: 1 },
];

export const modelos5020: ModeloVentaneria[] = [
  {
    id: '5020-2-hojas',
    nombre: '5020 2 hojas',
    sistema: '5020',
    diseno: {
      tipo: 'corredera',
      apiladas: false,
      hojas: [
        { tipo: 'corredera', proporcion: 0.5 },
        { tipo: 'corredera', proporcion: 0.5 },
      ],
    },
    ejemplo: { ancho: 109.2, alto: 43.6 },
    piezas: [
      p('ALNA-144', 'CABEZAL', a(), 1),
      p('ALNA-194', 'SILLAR', a(), 1),
      p('ALNB-193', 'JAMBA', h(1.5), 2),
      p('ALNB-147', 'ENGANCHE', h(3), 2),
      p('ALNA-192', 'TRASLAPE', h(3), 2),
      p('ALNA-349', 'HORIZONTAL', a(2.8, 2), 4),
    ],
    vidrios: [v('HOJAS CORR.', 'vidrio', 4, h(9.5), a(6.8, 2), 2)],
    empaqueTipo: '5020',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: accesorios5020(1),
  },

  {
    id: '5020-3-hojas',
    nombre: '5020 3 hojas',
    sistema: '5020',
    diseno: {
      tipo: 'corredera',
      apiladas: false,
      hojas: [
        { tipo: 'corredera', proporcion: 0.24 },
        { tipo: 'corredera', proporcion: 0.24 },
        { tipo: 'fija', proporcion: 0.52 },
      ],
    },
    ejemplo: { ancho: 300, alto: 150 },
    piezas: [
      p('ALNA-144', 'CABEZAL', a(), 1),
      p('ALNA-194', 'SILLAR', a(), 1),
      p('ALNB-193', 'JAMBA', h(1.5), 2),
      p('ALNB-147', 'ENGANCHE', h(3), 4),
      p('ALNA-192', 'TRASLAPE', h(3), 2),
      p('ALNA-349', 'HOR, CORR.', a(11, 4), 4),
      p('ALNA-349', 'HOR. FIJO', a(-8.4, 2), 2),
    ],
    vidrios: [
      v('HOJAS CORR.', 'vidrio', 4, h(9.5), a(18.6, 4), 2),
      v('HOJA FIJA', 'vidrio', 4, h(9.5), a(-2.4, 2), 1),
    ],
    empaqueTipo: '5020',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'TORNILLERIA', descripcion: '8 X 1¨', cantidad: 16 },
      { seccion: 'TORNILLERIA', descripcion: '8X 1/2', cantidad: 4 },
      { seccion: 'TORNILLERIA', descripcion: '8X 1 1/2¨', cantidad: 6 },
      { seccion: 'RODACHINAS', descripcion: 'AMERICANAS 5020', cantidad: 4 },
      { seccion: 'CHAZOS', descripcion: '0.25', cantidad: 6 },
      { seccion: 'REMACHES', descripcion: '4 - 2´', cantidad: 4 },
      { seccion: 'GUIAS', descripcion: '5020', cantidad: 6 },
      { seccion: 'SEGURO', descripcion: 'PUNTO ROJO', cantidad: 2 },
    ],
  },

  {
    id: '5020-4-hojas',
    nombre: '5020 4 hojas',
    sistema: '5020',
    diseno: {
      tipo: 'corredera',
      apiladas: false,
      hojas: [
        { tipo: 'corredera', proporcion: 0.25 },
        { tipo: 'corredera', proporcion: 0.25 },
        { tipo: 'corredera', proporcion: 0.25 },
        { tipo: 'corredera', proporcion: 0.25 },
      ],
    },
    ejemplo: { ancho: 300, alto: 150 },
    piezas: [
      p('ALNA-144', 'CABEZAL', a(), 1),
      p('ALNA-194', 'SILLAR', a(), 1),
      p('ALNB-193', 'JAMBA', h(1.5), 2),
      p('ALNB-147', 'ENGANCHE', h(3), 4),
      p('ALNA-192', 'TRASLAPE', h(3), 4),
      p('ALNA-349', 'HORIZONTAL', a(2.2, 4), 8),
    ],
    vidrios: [v('HOJAS', 'vidrio', 4, h(9.6), { base: 'ancho', resta: 10.6, divisor: 4 }, 4)],
    empaqueTipo: '5020',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'TORNILLERIA', descripcion: '8 x 3/4¨', cantidad: 16 },
      { seccion: 'TORNILLERIA', descripcion: '8 x 1 1/2¨', cantidad: 10 },
      { seccion: 'TORNILLERIA', descripcion: '8 X 1/2´', cantidad: 4 },
      { seccion: 'REMACHES', descripcion: '4 - 2´', cantidad: 4 },
      { seccion: 'CHAZOS', descripcion: '1/4´´', cantidad: 10 },
      { seccion: 'RODACHINAS', descripcion: 'AMERICANAS 5020', cantidad: 4 },
      { seccion: 'GUIAS', descripcion: 'PLASTICAS 5020', cantidad: 6 },
      { seccion: 'SEGURO', descripcion: 'PUNTO ROJO', cantidad: 2 },
    ],
  },
];
