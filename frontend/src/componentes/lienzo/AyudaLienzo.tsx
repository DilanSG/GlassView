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
        <li>Rueda del ratón: acercar o alejar.</li>
        <li>Herramienta «mano»: desplazar el plano.</li>
        <li>Selecciona una pieza y pulsa el «+» central para medirla.</li>
        <li>Supr: eliminar la pieza seleccionada.</li>
        <li>Tras dibujar, elige la REF del catálogo.</li>
      </ul>
    </aside>
  );
}
