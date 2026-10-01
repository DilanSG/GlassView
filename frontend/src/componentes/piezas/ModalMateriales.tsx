import { useEffect, useState } from 'react';
import type { MaterialPieza, TipoPiezaPersonalizada } from '../../tipos';

export interface ModalMaterialesProps {
  materiales: MaterialPieza[];
  seleccionado?: string;
  onElegir: (material: MaterialPieza | null) => void;
  onCrear: (material: MaterialPieza) => void;
  onCerrar: () => void;
  /** Título de la cabecera. */
  titulo?: string;
  /** Texto de ayuda de la cabecera. */
  descripcion?: string;
  /** Texto del botón que quita el material. */
  textoSinMaterial?: string;
  /** Si se indica, aparece la opción de usar el material general de la pieza. */
  onMaterialPieza?: () => void;
}

const TIPOS_MATERIAL: Array<{ id: TipoPiezaPersonalizada; etiqueta: string }> = [
  { id: 'perfil', etiqueta: 'Perfil de aluminio' },
  { id: 'vidrio', etiqueta: 'Vidrio' },
  { id: 'acrilico', etiqueta: 'Acrílico' },
  { id: 'herraje', etiqueta: 'Herraje' },
];

const ETIQUETA_TIPO: Record<TipoPiezaPersonalizada, string> = {
  perfil: 'Perfil',
  vidrio: 'Vidrio',
  acrilico: 'Acrílico',
  herraje: 'Herraje',
};

/** Galería de materiales con su color, para elegir o crear uno nuevo. */
export default function ModalMateriales({
  materiales,
  seleccionado,
  onElegir,
  onCrear,
  onCerrar,
  titulo = 'Materiales',
  descripcion = 'Elige con qué se fabrica la pieza o crea un material propio.',
  textoSinMaterial = 'Sin material',
  onMaterialPieza,
}: ModalMaterialesProps) {
  const [nuevo, setNuevo] = useState({
    nombre: '',
    color: '#d7dade',
    tipo: 'perfil' as TipoPiezaPersonalizada,
  });

  useEffect(() => {
    function manejarTecla(evento: KeyboardEvent): void {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', manejarTecla);
    return () => window.removeEventListener('keydown', manejarTecla);
  }, [onCerrar]);

  const propios = materiales.filter((material) => material.id.startsWith('mat-'));

  function tarjeta(material: MaterialPieza) {
    return (
      <li key={material.id}>
        <button
          type="button"
          className={`tarjeta-material ${seleccionado === material.nombre ? 'activa' : ''}`}
          onClick={() => {
            onElegir(material);
            onCerrar();
          }}
        >
          <span className="tarjeta-material-color" style={{ backgroundColor: material.color }} />
          <span className="tarjeta-material-info">
            <span className="tarjeta-material-nombre">{material.nombre}</span>
            <span className="tarjeta-material-tipo">{ETIQUETA_TIPO[material.tipo]}</span>
          </span>
        </button>
      </li>
    );
  }

  return (
    <div className="modal-fondo" role="dialog" aria-modal="true" aria-label="Materiales">
      <div className="modal modal-materiales">
        <header className="modal-cabecera">
          <div>
            <h3>{titulo}</h3>
            <p>{descripcion}</p>
          </div>
          <button type="button" className="modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="modal-materiales-cuerpo">
          <section className="modal-materiales-seccion">
            <h4>Materiales</h4>
            <ul className="rejilla-materiales">
              {materiales
                .filter((material) => !material.id.startsWith('mat-'))
                .map((material) => tarjeta(material))}
            </ul>
          </section>

          {propios.length > 0 && (
            <section className="modal-materiales-seccion">
              <h4>Tus materiales</h4>
              <ul className="rejilla-materiales">{propios.map((material) => tarjeta(material))}</ul>
            </section>
          )}
        </div>

        <footer className="modal-materiales-pie">
          <div className="material-nuevo">
            <input
              value={nuevo.nombre}
              onChange={(evento) => setNuevo({ ...nuevo, nombre: evento.target.value })}
              placeholder="Nombre del material"
            />
            <input
              type="color"
              value={nuevo.color}
              onChange={(evento) => setNuevo({ ...nuevo, color: evento.target.value })}
              title="Color del material"
            />
            <select
              value={nuevo.tipo}
              onChange={(evento) =>
                setNuevo({ ...nuevo, tipo: evento.target.value as TipoPiezaPersonalizada })
              }
            >
              {TIPOS_MATERIAL.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.etiqueta}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="boton-primario"
              disabled={nuevo.nombre.trim().length < 2}
              onClick={() => {
                onCrear({
                  id: `mat-${Date.now().toString(36)}`,
                  nombre: nuevo.nombre.trim(),
                  color: nuevo.color,
                  tipo: nuevo.tipo,
                });
                onCerrar();
              }}
            >
              Crear material
            </button>
          </div>
          <button
            type="button"
            className="boton-secundario"
            onClick={() => {
              onElegir(null);
              onCerrar();
            }}
          >
            {textoSinMaterial}
          </button>
          {onMaterialPieza && (
            <button
              type="button"
              className="boton-secundario"
              onClick={() => {
                onMaterialPieza();
                onCerrar();
              }}
            >
              Material de la pieza
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
