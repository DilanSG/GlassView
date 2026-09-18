import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { guardarToken, verificarPin } from '../api/clienteApi';
import PieDePagina from '../components/PieDePagina';

export default function Acceso() {
  const [pin, setPin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const navegar = useNavigate();

  async function manejarEnvio(evento: FormEvent): Promise<void> {
    evento.preventDefault();
    setCargando(true);
    setError('');

    try {
      const token = await verificarPin(pin);
      guardarToken(token);
      navegar('/proyectos');
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No se pudo acceder.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="pantalla-acceso">
      <form className="tarjeta-acceso" onSubmit={manejarEnvio}>
        <h1>GlassView</h1>
        <p>Planos de instalaciones de cristalería</p>

        <label htmlFor="pin">PIN de acceso</label>
        <input
          id="pin"
          type="password"
          value={pin}
          onChange={(evento) => setPin(evento.target.value)}
          placeholder="Introduce el PIN"
          autoFocus
          required
        />

        {error && <p className="mensaje-error">{error}</p>}

        <button type="submit" disabled={cargando}>
          {cargando ? 'Comprobando...' : 'Entrar'}
        </button>
      </form>
      <PieDePagina />
    </div>
  );
}