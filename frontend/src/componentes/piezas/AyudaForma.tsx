export interface AyudaFormaProps {
  abierta: boolean;
  onCerrar: () => void;
}

/** Instrucciones del editor de formas de la pieza, con todas las herramientas. */
export default function AyudaForma({ abierta, onCerrar }: AyudaFormaProps): JSX.Element | null {
  if (!abierta) {
    return null;
  }

  return (
    <aside
      className="ayuda-popout ayuda-forma"
      role="dialog"
      aria-label="Instrucciones del editor de piezas"
    >
      <header className="ayuda-popout-cabecera">
        <h3>Cómo diseñar la pieza</h3>
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
        <li>1 cuadro de la rejilla = 1 cm; los vértices se ajustan a medio centímetro.</li>
        <li>
          <strong>Punto:</strong> toca el lienzo para añadir vértices. La línea guía sale del
          punto más oscuro (el último).
        </li>
        <li>
          <strong>Cerrar la figura:</strong> toca un punto anterior. Al cerrarla eliges su
          material.
        </li>
        <li>
          Para dibujar otra figura, pulsa <strong>+</strong> en el panel de capas.
        </li>
        <li>
          <strong>Seleccionar:</strong> toca un vértice para seleccionarlo y arrástralo para
          moverlo; Supr lo borra. Toca una figura para activarla.
        </li>
        <li>
          <strong>Mover:</strong> arrastra una figura completa; se mantiene dentro del lienzo.
        </li>
        <li>
          <strong>Borrar punto:</strong> toca un vértice para eliminarlo.
        </li>
        <li>
          <strong>Borrar figura:</strong> toca una figura para eliminarla completa.
        </li>
        <li>
          <strong>Material:</strong> toca una figura para elegir su material, usar el de la pieza
          o dejarla como hueco.
        </li>
        <li>
          <strong>Rectángulo:</strong> crea un rectángulo en la capa activa.
        </li>
        <li>
          <strong>Vaciar:</strong> deja la capa activa lista para volver a trazar.
        </li>
        <li>
          <strong>Capas:</strong> + añade una capa; la papelera la elimina; las flechas la suben o
          bajan en el orden de pintado; el ojo la muestra u oculta.
        </li>
        <li>
          El lápiz de una capa cambia su nombre (o doble clic sobre él); el cuadro de color es su
          material.
        </li>
        <li>
          Con la herramienta <strong>Material</strong> también puedes tocar una figura para
          cambiarle el material.
        </li>
        <li>
          <strong>Deshacer</strong> y <strong>rehacer</strong> están sobre el lienzo (Ctrl+Z y
          Ctrl+Shift+Z).
        </li>
      </ul>
    </aside>
  );
}
