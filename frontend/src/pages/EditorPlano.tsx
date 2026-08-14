import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { actualizarProyecto, obtenerProyecto } from '../api/clienteApi';
import DisenoProyecto from '../components/DisenoProyecto';
import type { Proyecto } from '../tipos';

export default function EditorPlano() {
  const { id } = useParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      return;
    }
    cargarProyecto(id);
  }, [id]);

  async function cargarProyecto(idProyecto: string): Promise<void> {
    setCargando(true);
    try {
      const proyectoEncontrado = await obtenerProyecto(idProyecto);
      setProyecto(proyectoEncontrado);
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'Error al cargar el proyecto.');
    } finally {
      setCargando(false);
    }
  }

  async function actualizarProyectoEnServidor(datos: Partial<Proyecto>): Promise<Proyecto> {
    if (!proyecto) {
      throw new Error('Proyecto no cargado.');
    }
    const actualizado = await actualizarProyecto(proyecto._id, datos);
    setProyecto(actualizado);
    return actualizado;
  }

  if (cargando) {
    return <p>Cargando plano...</p>;
  }

  if (!proyecto) {
    return <p className="mensaje-error">{error || 'Proyecto no encontrado.'}</p>;
  }

  return (
    <DisenoProyecto
      proyecto={proyecto}
      onActualizarProyecto={actualizarProyectoEnServidor}
      modoInicial="vista"
    />
  );
}