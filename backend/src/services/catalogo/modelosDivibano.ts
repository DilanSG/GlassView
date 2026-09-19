import { a, h, f, p, v } from './tipos.js';
import type { ModeloVentaneria } from './tipos.js';

export const modelosDivibano: ModeloVentaneria[] = [
  {
    id: 'divibano-acrilico',
    nombre: 'Divibaño acrílico',
    sistema: 'DIVIBANO',
    diseno: {
      tipo: 'divibano',
      apiladas: false,
      hojas: [
        { tipo: 'corredera', proporcion: 0.5 },
        { tipo: 'fija', proporcion: 0.5 },
      ],
    },
    ejemplo: { ancho: 114, alto: 180 },
    piezas: [
      p('ALNA-346', 'CABEZAL', a(), 1),
      p('S-597', 'SILLAR', a(1), 1),
      p('ALN-343', 'JAMBA', h(3), 2),
      p('S-596', 'U LIVIANA HOJA CORR.', h(5), 2, 45),
      p('S-596', 'U LIVIANA HOJA FIJA', h(4.5), 2),
      p('S-596', 'U LIVIANA H.', a(-1.5, 2), 4),
      p('ALN-234', 'BARRA TOALLERO', f(49.75), 2),
      p('S-1362', 'SOPORTE TOALLERO', f(8), 2),
      p('S-540', 'MANIJA', f(8), 1),
      p('A-011', 'ANGULO CHAPETA 1x1¨', f(1.2), 8, 90),
    ],
    vidrios: [
      v('HOJA CORR.', 'acrilico', 6, h(9), a(6.5, 2), 1),
      v('HOJA FIJA', 'acrilico', 6, h(8.5), a(6.5, 2), 1),
    ],
    empaqueTipo: 'DIVIBANO',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'RODACHINAS', descripcion: 'TRIANGULO', cantidad: 2 },
      { seccion: 'REMACHES', descripcion: 'POP. 4 - 4¨', cantidad: 20 },
      { seccion: 'TORNILLOS', descripcion: 'PAN 8 x 1¨', cantidad: 8 },
      { seccion: 'TORNILLOS', descripcion: 'AVELLANADO 8 x 1¨', cantidad: 6 },
      { seccion: 'CHAZOS', descripcion: 'PLASTICO 1/4¨', cantidad: 6 },
    ],
  },

  {
    id: 'alacena',
    nombre: 'Alacena U. 2 hojas',
    sistema: 'DIVIBANO',
    diseno: {
      tipo: 'alacena',
      apiladas: false,
      hojas: [
        { tipo: 'corredera', proporcion: 0.5 },
        { tipo: 'corredera', proporcion: 0.5 },
      ],
    },
    ejemplo: { ancho: 80, alto: 80 },
    piezas: [
      p('S-597', 'SILLAR DIV DE BAÑO', a(), 1, 45),
      p('S-597', 'CABEZAL DIV DE BAÑO', a(), 1, 45),
      p('ALN-343', 'JAMBAS U.', h(), 2, 45),
      p('S-596', 'U LIVIANA PARAL', h(2.5), 4, 45),
      p('S-596', 'U LIVIANA H SUP', a(-0.9, 2), 4, 45),
      p('A-011', 'CHAPETAS 1X1¨', f(1.1), 8, 90),
    ],
    vidrios: [v('ACRILICOS', 'acrilico', 4, h(6.5), a(7.1, 2), 2)],
    empaqueTipo: '5020',
    empaqueFactor: 1,
    empaqueExtraPorHoja: 0,
    accesorios: [
      { seccion: 'RODACHINAS', descripcion: 'DE PISO', cantidad: 4 },
      { seccion: 'REMACHES', descripcion: 'POP. 5 - 4¨', cantidad: 12 },
      { seccion: 'REMACHES', descripcion: 'POP. 4 - 4¨', cantidad: 20 },
      { seccion: 'TORNILLERIA', descripcion: 'AVELLANADO 8 X 1¨', cantidad: 4 },
      { seccion: 'CHAZOS', descripcion: 'PLASTICO 1/4¨', cantidad: 4 },
      { seccion: 'MANIJAS', descripcion: 'ALUMINIO DIVISION DE BAÑO', cantidad: 2 },
    ],
  },
];
