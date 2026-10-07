import { useMemo } from 'react';
import { Line, Rect, Text } from 'react-konva';
import { PX_POR_CM } from '../../constantes';
import type { VistaPlano } from '../../hooks/useZoomPan';

export interface ReglasLienzoProps {
  vista: VistaPlano;
  tamanoVista: { ancho: number; alto: number };
  colorFondo: string;
  colorMarca: string;
  colorEtiqueta: string;
  colorOrigen: string;
}

/**
 * Grosor de la regla en píxeles. En pantallas pequeñas (móvil en horizontal)
 * se reduce para que no le robe espacio al plano.
 */
export function grosorRegla(tamano: { ancho: number; alto: number }): number {
  return tamano.alto < 560 || tamano.ancho < 720 ? 16 : 20;
}

/** Pasos de centímetros posibles para las marcas. */
const PASOS_CM = [1, 2, 5, 10, 20, 25, 50, 100, 200, 500, 1000, 2000, 5000];
/** Separación mínima en pantalla entre etiquetas para que no se solapen. */
const SEPARACION_ETIQUETAS = 46;

interface Marca {
  /** Posición en píxeles de pantalla dentro del lienzo. */
  posicion: number;
  /** Valor en centímetros que se escribe en la etiqueta. */
  etiqueta: number;
  /** true para el origen (0 cm), que se marca más fuerte. */
  origen: boolean;
}

/** Paso en centímetros para que las etiquetas queden legibles con el zoom actual. */
function elegirPaso(zoom: number): number {
  const pxPorCm = Math.max(zoom * PX_POR_CM, 0.001);
  for (const paso of PASOS_CM) {
    if (paso * pxPorCm >= SEPARACION_ETIQUETAS) {
      return paso;
    }
  }
  const mayor = PASOS_CM[PASOS_CM.length - 1];
  return Math.ceil(SEPARACION_ETIQUETAS / pxPorCm / mayor) * mayor;
}

function calcularMarcas(
  minimoCm: number,
  maximoCm: number,
  paso: number,
  aPantalla: (cm: number) => number,
): Marca[] {
  const marcas: Marca[] = [];
  const inicio = Math.floor(minimoCm / paso) * paso;
  for (let cm = inicio; cm <= maximoCm; cm += paso) {
    marcas.push({ posicion: aPantalla(cm), etiqueta: cm, origen: cm === 0 });
  }
  return marcas;
}

/**
 * Reglas de centímetros en los bordes superior e izquierdo del lienzo.
 * Se dibujan en una capa de Konva en coordenadas de pantalla (no del mundo)
 * y se recalculan con el zoom y el desplazamiento para que cada marca indique
 * la medida real en centímetros.
 */
export default function ReglasLienzo({
  vista,
  tamanoVista,
  colorFondo,
  colorMarca,
  colorEtiqueta,
  colorOrigen,
}: ReglasLienzoProps): JSX.Element {
  const { ancho, alto } = tamanoVista;
  const grosor = grosorRegla(tamanoVista);
  const compacta = grosor < 20;
  const fuente = compacta ? 8 : 9;
  const inicioMarca = compacta ? 3 : 4;

  const { marcasX, marcasY } = useMemo(() => {
    const zoom = Math.max(vista.zoom, 0.001);
    const paso = elegirPaso(zoom);
    const aPantallaX = (cm: number): number => vista.x + cm * PX_POR_CM * zoom;
    const aPantallaY = (cm: number): number => vista.y + cm * PX_POR_CM * zoom;
    return {
      marcasX: calcularMarcas(
        (0 - vista.x) / zoom / PX_POR_CM,
        (ancho - vista.x) / zoom / PX_POR_CM,
        paso,
        aPantallaX,
      ),
      marcasY: calcularMarcas(
        (0 - vista.y) / zoom / PX_POR_CM,
        (alto - vista.y) / zoom / PX_POR_CM,
        paso,
        aPantallaY,
      ),
    };
  }, [vista, ancho, alto]);

  return (
    <>
      {/* Regla superior */}
      <Rect x={0} y={0} width={ancho} height={grosor} fill={colorFondo} listening={false} />
      {marcasX.map((marca) => (
        <Line
          key={`marca-x-${marca.etiqueta}`}
          points={[
            marca.posicion,
            marca.origen ? inicioMarca : grosor - 8,
            marca.posicion,
            grosor,
          ]}
          stroke={marca.origen ? colorOrigen : colorMarca}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {marcasX.map((marca) => (
        <Text
          key={`texto-x-${marca.etiqueta}`}
          x={marca.posicion + 3}
          y={compacta ? 4 : 5}
          text={String(marca.etiqueta)}
          fontSize={fuente}
          fill={colorEtiqueta}
          listening={false}
        />
      ))}
      <Line
        points={[0, grosor, ancho, grosor]}
        stroke={colorMarca}
        strokeWidth={1}
        listening={false}
      />

      {/* Regla izquierda */}
      <Rect x={0} y={0} width={grosor} height={alto} fill={colorFondo} listening={false} />
      {marcasY.map((marca) => (
        <Line
          key={`marca-y-${marca.etiqueta}`}
          points={[
            marca.origen ? inicioMarca : grosor - 8,
            marca.posicion,
            grosor,
            marca.posicion,
          ]}
          stroke={marca.origen ? colorOrigen : colorMarca}
          strokeWidth={1}
          listening={false}
        />
      ))}
      {marcasY.map((marca) => (
        <Text
          key={`texto-y-${marca.etiqueta}`}
          x={2}
          y={marca.posicion - (compacta ? 9 : 11)}
          text={String(marca.etiqueta)}
          fontSize={fuente}
          fill={colorEtiqueta}
          listening={false}
        />
      ))}
      <Line
        points={[grosor, 0, grosor, alto]}
        stroke={colorMarca}
        strokeWidth={1}
        listening={false}
      />

      {/* Esquina superior izquierda */}
      <Rect x={0} y={0} width={grosor} height={grosor} fill={colorFondo} listening={false} />
      <Line
        points={[0, grosor, grosor, grosor]}
        stroke={colorMarca}
        strokeWidth={1}
        listening={false}
      />
      <Line
        points={[grosor, 0, grosor, grosor]}
        stroke={colorMarca}
        strokeWidth={1}
        listening={false}
      />
    </>
  );
}
