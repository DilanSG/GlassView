import type { PerfilVentaneria, PiezaPlano } from '../tipos';
import { parametrosDe, resolverIdentidad } from './resolver';
import type { IdentidadPieza, ParametrosPerfil } from './tipos';

export interface ContextoPiezaResuelto {
  identidad: IdentidadPieza;
  params: ParametrosPerfil;
  /** Lado del peralte hacia el vidrio/interior (-1 = lado 0, 1 = lado peralte). */
  interior: -1 | 1;
}

function centro(pieza: PiezaPlano): { x: number; y: number } {
  return { x: pieza.x + pieza.anchoCm / 2, y: pieza.y + pieza.altoCm / 2 };
}

/**
 * Orden de dibujo: primero los vidrios/acrílicos y encima los perfiles y
 * herrajes, porque en la realidad el perfil monta por delante de la lámina.
 */
export function ordenarPiezasParaDibujo(piezas: PiezaPlano[]): PiezaPlano[] {
  const vidrios: PiezaPlano[] = [];
  const resto: PiezaPlano[] = [];
  for (const pieza of piezas) {
    const esLamina =
      pieza.tipo === 'vidrio' ||
      pieza.tipo === 'acrilico' ||
      /^(VID|ACR)/i.test(pieza.ref ?? '');
    (esLamina ? vidrios : resto).push(pieza);
  }
  return [...vidrios, ...resto];
}

function distanciaCentros(a: PiezaPlano, b: PiezaPlano): number {
  const centroA = centro(a);
  const centroB = centro(b);
  return Math.hypot(centroA.x - centroB.x, centroA.y - centroB.y);
}

/**
 * Resuelve la identidad y el lado interior de cada pieza. El lado interior
 * (hacia dónde abre la garganta de vidrio o el gancho) se deduce del vidrio
 * más cercano y, si no hay, del centro de la composición.
 */
export function crearContextosPiezas(
  piezas: PiezaPlano[],
  perfiles: PerfilVentaneria[],
): Map<string, ContextoPiezaResuelto> {
  const contextos = new Map<string, ContextoPiezaResuelto>();
  const identidades = new Map<string, IdentidadPieza>();

  piezas.forEach((pieza) => {
    identidades.set(pieza.id, resolverIdentidad(pieza, perfiles));
  });

  const vidrios = piezas.filter((pieza) => {
    const identidad = identidades.get(pieza.id);
    return identidad?.clase === 'vidrio' || identidad?.clase === 'acrilico';
  });

  const centros = piezas.filter((pieza) => pieza.orientacion !== 'punto').map(centro);
  const centroComposicion =
    centros.length > 0
      ? {
          x: centros.reduce((suma, punto) => suma + punto.x, 0) / centros.length,
          y: centros.reduce((suma, punto) => suma + punto.y, 0) / centros.length,
        }
      : null;

  piezas.forEach((pieza) => {
    const identidad = identidades.get(pieza.id)!;
    const params = parametrosDe(identidad);

    let interior: -1 | 1 = 1;
    if (pieza.orientacion !== 'punto') {
      const centroPieza = centro(pieza);
      let vidrioCercano: PiezaPlano | null = null;
      let distanciaMinima = Infinity;
      vidrios.forEach((vidrio) => {
        const distancia = distanciaCentros(pieza, vidrio);
        if (distancia < distanciaMinima) {
          distanciaMinima = distancia;
          vidrioCercano = vidrio;
        }
      });

      const referencia = vidrioCercano ? centro(vidrioCercano) : centroComposicion;
      if (referencia) {
        if (pieza.orientacion === 'horizontal') {
          interior = referencia.y >= centroPieza.y ? 1 : -1;
        } else {
          interior = referencia.x >= centroPieza.x ? 1 : -1;
        }
      }
    }

    contextos.set(pieza.id, { identidad, params, interior });
  });

  return contextos;
}
