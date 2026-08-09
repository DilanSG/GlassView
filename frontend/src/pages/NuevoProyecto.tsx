import { useState, type FormEvent } from 'react';
import { actualizarProyecto, crearProyecto } from '../api/clienteApi';
import DisenoProyecto from '../components/DisenoProyecto';
import type { Proyecto } from '../tipos';

export default function NuevoProyecto() {
  const [nombre, setNombre] = useState('');
  const [cliente, setCliente] = useState('');
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  async function manejarCreacion(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    if (!nombre.trim()) {
      return;
    }
    setCreando(true);
    setError('');
    try {
      const proyectoCreado = await crearProyecto({
        nombre: nombre.trim(),
        cliente: cliente.trim() || undefined,
      });
      setProyecto(proyectoCreado);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al crear el proyecto.');
    } finally {
      setCreando(false);
    }
  }

  async function actualizarProyectoEnServidor(datos: Partial<Proyecto>): Promise<Proyecto> {
    if (!proyecto) {
      throw new Error('Proyecto no creado.');
    }
    const actualizado = await actualizarProyecto(proyecto._id, datos);
    setProyecto(actualizado);
    return actualizado;
  }

  if (proyecto) {
    return (
      <DisenoProyecto proyecto={proyecto} onActualizarProyecto={actualizarProyectoEnServidor} />
    );
  }

  return (
    <div className="pantalla">
      <header className="cabecera-editor">
        <h1>Nuevo proyecto</h1>
      </header>

      <div className="editor-distribucion">
        <div className="area-dibujo">
          <p className="aviso-lienzo">
            Crea el proyecto para empezar a dibujar el plano: elige un modelo de ventanería en la
            barra de herramientas y arrastra sobre el lienzo.
          </p>
        </div>

        <aside className="panel-nuevo-proyecto">
          <h2>Datos del proyecto</h2>
          <form onSubmit={manejarCreacion}>
            <label htmlFor="nombre">Nombre del proyecto</label>
            <input
              id="nombre"
              value={nombre}
              onChange={(evento) => setNombre(evento.target.value)}
              placeholder="Ej.: Escalera edificio San Martín"
              autoFocus
              required
            />
            <label htmlFor="cliente">Cliente</label>
            <input
              id="cliente"
              value={cliente}
              onChange={(evento) => setCliente(evento.target.value)}
              placeholder="Opcional"
            />

            {error && (
              <div className="aviso aviso-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="boton-primario" disabled={creando}>
              {creando ? 'Creando...' : 'Crear y dibujar plano'}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}