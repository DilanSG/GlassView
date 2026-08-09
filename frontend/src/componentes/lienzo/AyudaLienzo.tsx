/** Texto de ayuda bajo el lienzo con los atajos y modos de uso. */
export default function AyudaLienzo(): JSX.Element {
  return (
    <p className="lienzo-ayuda">
      1 cm = un cuadro de la rejilla · Rueda del ratón para acercar/alejar · Herramienta «mano»
      para desplazar el plano · Selecciona una pieza y pulsa el «+» central para editar su medida ·
      Supr para eliminar · Tras dibujar, elige la REF del catálogo
    </p>
  );
}