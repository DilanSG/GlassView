import { useEffect, useState } from 'react';
import gsap from 'gsap';

const ESPACIADO_FILA = 140;

/**
 * Dibuja pulsos de luz sobre las líneas horizontales principales del plano.
 * Cada línea grande tiene su propio segmento con posición y ritmo distintos,
 * de modo que los destellos aparecen dispersos y no a la vez.
 */
export default function PulsosPlano() {
  const [filas, setFilas] = useState<number[]>([]);

  useEffect(() => {
    const calcularFilas = (): number[] => {
      const cantidad = Math.floor(window.innerHeight / ESPACIADO_FILA);
      return Array.from({ length: cantidad }, (_, indice) => indice * ESPACIADO_FILA);
    };

    setFilas(calcularFilas());

    const manejarRedimension = (): void => setFilas(calcularFilas());
    window.addEventListener('resize', manejarRedimension);
    return () => window.removeEventListener('resize', manejarRedimension);
  }, []);

  useEffect(() => {
    if (filas.length === 0) {
      return;
    }

    const prefiereMovimientoReducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereMovimientoReducido) {
      return;
    }

    const elementos = document.querySelectorAll<HTMLElement>('.pulso-fila');
    const tweensActivos = new Set<gsap.core.Tween>();

    function programarPasada(elemento: HTMLElement): void {
      const tween = gsap.fromTo(
        elemento,
        { x: '110vw' },
        {
          x: '-20vw',
          duration: gsap.utils.random(9, 11),
          delay: gsap.utils.random(0, 12),
          ease: 'power1.inOut',
          onComplete: () => {
            tweensActivos.delete(tween);
            programarPasada(elemento);
          },
        },
      );
      tweensActivos.add(tween);
    }

    elementos.forEach((elemento) => programarPasada(elemento));

    return () => {
      tweensActivos.forEach((tween) => tween.kill());
      tweensActivos.clear();
    };
  }, [filas]);

  return (
    <span className="contenedor-pulsos" aria-hidden="true">
      {filas.map((fila) => (
        <span key={fila} className="pulso-fila" style={{ top: `${fila}px` }} />
      ))}
    </span>
  );
}