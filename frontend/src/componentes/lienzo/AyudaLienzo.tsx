export interface AyudaLienzoProps {
  abierta: boolean;
  onCerrar: () => void;
}

/** Popout de ayuda con los atajos y modos de uso del lienzo. */
export default function AyudaLienzo({ abierta, onCerrar }: AyudaLienzoProps): JSX.Element | null {
  if (!abierta) {
    return null;
  }

  return (
    <aside className="ayuda-popout" role="dialog" aria-label="Atajos y ayuda">
      <header className="ayuda-popout-cabecera">
        <h3>Atajos y ayuda</h3>
        <button
          type="button"
          className="ayuda-popout-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar la ayuda"
          title="Cerrar"
        >
          ×
        </button>
      </header>
      <ul className="ayuda-popout-lista">
        <li>1 cm = un cuadro de la rejilla.</li>
        <li>En el móvil: toca una pieza para seleccionarla y arrástrala para moverla.</li>
        <li>Pellizca con dos dedos para acercar o alejar y desplazar el plano.</li>
        <li>Con «Desplazar plano» (mano) arrastra con un dedo para moverte.</li>
        <li>Con «Seleccionar», arrastra sobre el vacío para elegir varias piezas.</li>
        <li>Rueda del ratón: acercar o alejar.</li>
        <li>Pieza seleccionada y pulsa el «+» central para medirla.</li>
        <li>Supr: eliminar la pieza seleccionada.</li>
        <li>Ctrl+Z: deshacer el último cambio.</li>
        <li>Tras dibujar, elige la REF del catálogo.</li>
      </ul>
    </aside>
  );
}
