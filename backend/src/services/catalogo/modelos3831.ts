import { a, h, f, p, v } from './tipos.js';
import type { ModeloVentaneria } from './tipos.js';

/** Modelos de la familia 3831. */
export const modelos3831: ModeloVentaneria[] = [
  {
    id: 'fijo-pro-3831',
    nombre: 'Fijo PRO-3831',
    sistema: '3831',
    diseno: {
      tipo: 'fijo',
      apiladas: false,
      hojas: [{ tipo: 'fija', proporcion: 1 }],
    },
    ejemplo: { ancho: 162, alto: 141 },
    piezas: [
      p('ALNA-A-173', 'CABEZAL SILLAR', h(), 2),
      p('ALN-A-174', 'JAMBA', a(3.2), 2),
      p('ALN-635 CURVO', 'PISA VIDRIO', h(2.2), 2, 45),
    ],
    vidrios: [v('VIDRIO', 'vidrio', 4, a(4.2), h(4.2), 2)],
    empaqueTipo: 'ESTRELLA',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'REMACHES', descripcion: '4 - 4¨', cantidad: 16 },
      { seccion: 'TORNILLOS', descripcion: 'NORMAL 8 x 1/2¨', cantidad: 8 },
      { seccion: 'TORNILLOS', descripcion: 'AVELLANADO 1/4¨', cantidad: 6 },
      { seccion: 'CHAZOS', descripcion: '1/4¨', cantidad: 6 },
    ],
  },

  {
    id: 'fijo-3831-1-basculante',
    nombre: 'Fijo 3831 + 1 basculante',
    sistema: '3831',
    diseno: {
      tipo: 'basculante',
      apiladas: true,
      hojas: [
        { tipo: 'fija', proporcion: 0.81 },
        { tipo: 'basculante', proporcion: 0.19 },
      ],
    },
    ejemplo: { ancho: 100, alto: 100 },
    piezas: [
      p('ALN-173', 'CABEZAL', a(), 1),
      p('ALN-173', 'SILLAR', a(), 1),
      p('ALN-174', 'JAMBA', h(3.8), 2),
      p('ALN-292', 'DIVISOR', h(3.8), 1),
      p('', 'ANGULO CHAPETA 1x1¨', f(3.4), 8),
      p('ALN-176', 'Z DE HOJA PARAL', h(5), 2, 45),
      p('ALN-176', 'Z DE HOJA HORIZ', f(21.9), 2),
      p('', 'PISAVIDRIO HORIZ. FIJO', f(46.2), 2),
      p('', 'PISAVIDRIO PARALES FIJO', h(0.8), 2),
      p('', 'PISAVIDRIO HORIZ. HOJA', f(18.7), 2),
      p('', 'PISAVIDRIO PARALES HOJA', h(5), 2),
    ],
    vidrios: [
      v('FIJO', 'acrilico', 4, h(9.2, 2), a(4.6), 1),
      v('HOJA', 'acrilico', 4, h(78.6, 2), a(9), 1),
    ],
    empaqueTipo: 'ESTRELLA',
    empaqueFactor: 2,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'REMACHES', descripcion: 'POP. 4 - 4¨', cantidad: 10 },
      { seccion: 'REMACHES', descripcion: 'POP. 5 - 4¨', cantidad: 10 },
      { seccion: 'TORNILLOS', descripcion: 'PAN 8 X 3/4', cantidad: 10 },
      { seccion: 'CHAZOS', descripcion: '1/4¨', cantidad: 8 },
      { seccion: 'MANIJA', descripcion: 'BASCULANTE', cantidad: 1 },
      { seccion: 'BRAZO', descripcion: 'BASCULANTE 8"', cantidad: 2 },
    ],
  },

  {
    id: 'fijo-3831-2-basculantes',
    nombre: 'Fijo 3831 + 2 basculantes',
    sistema: '3831',
    diseno: {
      tipo: 'basculante',
      apiladas: true,
      hojas: [
        { tipo: 'fija', proporcion: 0.48 },
        { tipo: 'basculante', proporcion: 0.26 },
        { tipo: 'basculante', proporcion: 0.26 },
      ],
    },
    ejemplo: { ancho: 170, alto: 112 },
    piezas: [
      p('ALN-173', 'CABEZAL', h(), 1),
      p('ALN-173', 'SILLAR', a(), 1),
      p('ALN-174', 'JAMBA', h(3.8), 2),
      p('ALN-292', 'DIVISOR', h(3.8), 2),
      p('', 'ANGULO CHAPETA 1x1¨', f(3.4), 12),
      p('ALN-176', 'Z DE HOJA PARAL', h(5), 4),
      p('ALN-176', 'Z DE HOJA HORIZ', a(12.4, 4), 4),
      p('', 'PISAVIDRIO HORIZ. FIJO', a(13.4, 3), 2),
      p('', 'PISAVIDRIO LATERALES FIJO', h(0.8), 2),
      p('', 'PISAVIDRIO HORIZ. HOJA', a(25.2, 4), 4),
      p('', 'PISAVIDRIO LATERALES HOJA', h(5), 4),
    ],
    vidrios: [
      v('FIJO', 'acrilico', 4, h(9.2, 2), a(62.6), 1),
      v('HOJA', 'acrilico', 4, h(55.6, 2), a(67), 2),
    ],
    empaqueTipo: 'ESTRELLA',
    empaqueFactor: 2,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'REMACHES', descripcion: 'POP. 4 - 4¨', cantidad: 10 },
      { seccion: 'REMACHES', descripcion: 'POP. 5 - 4¨', cantidad: 10 },
      { seccion: 'TORNILLOS', descripcion: 'PAN 8 X 3/4', cantidad: 10 },
      { seccion: 'CHAZOS', descripcion: '1/4¨', cantidad: 8 },
      { seccion: 'MANIJA', descripcion: 'BASCULANTE', cantidad: 1 },
      { seccion: 'BRAZO', descripcion: 'BASCULANTE 8"', cantidad: 2 },
    ],
  },
];
