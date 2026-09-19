import { useState, type ReactNode } from 'react';

interface CampoBaseProps {
  id: string;
  etiqueta: string;
  valor: string;
  onCambiar: (valor: string) => void;
  error?: string;
  exito?: string;
  ayuda?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
  minLength?: number;
  /** Contenido extra bajo el control (p. ej. la fuerza de la contraseña). */
  children?: ReactNode;
}

function Mensajes({ id, error, exito, ayuda }: Pick<CampoBaseProps, 'id' | 'error' | 'exito' | 'ayuda'>) {
  if (error) {
    return (
      <span className="campo-auth-mensaje" id={`${id}-error`} role="alert">
        {error}
      </span>
    );
  }
  if (exito) {
    return (
      <span className="campo-auth-mensaje campo-auth-mensaje-exito" id={`${id}-exito`}>
        {exito}
      </span>
    );
  }
  if (ayuda) {
    return (
      <span className="campo-auth-ayuda" id={`${id}-ayuda`}>
        {ayuda}
      </span>
    );
  }
  return null;
}

/** Campo de texto o correo con etiqueta, ayuda y error en línea. */
export function CampoAuth({
  id,
  etiqueta,
  tipo = 'text',
  ...resto
}: CampoBaseProps & { tipo?: 'text' | 'email' }) {
  const { valor, onCambiar, error, exito, ayuda, placeholder, autoComplete, autoFocus, required, minLength } = resto;

  return (
    <div className={`campo-auth ${error ? 'campo-auth-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo-auth-control">
        <input
          id={id}
          type={tipo}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          minLength={minLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : exito ? `${id}-exito` : ayuda ? `${id}-ayuda` : undefined}
        />
      </div>
      <Mensajes id={id} error={error} exito={exito} ayuda={ayuda} />
    </div>
  );
}

/** Campo de contraseña con botón para mostrarla u ocultarla. */
export function CampoContrasena({ id, etiqueta, ...resto }: CampoBaseProps) {
  const [visible, setVisible] = useState(false);
  const {
    valor,
    onCambiar,
    error,
    exito,
    ayuda,
    placeholder,
    autoComplete,
    autoFocus,
    required,
    minLength,
    children,
  } = resto;

  return (
    <div className={`campo-auth ${error ? 'campo-auth-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      <div className="campo-auth-control campo-auth-control-ojo">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(evento) => onCambiar(evento.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required={required}
          minLength={minLength}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : exito ? `${id}-exito` : ayuda ? `${id}-ayuda` : undefined}
        />
        <button
          type="button"
          className="campo-auth-ojo"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {visible ? (
              <>
                <path d="M3 3l18 18" />
                <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c5 0 9 4.5 9 6 0 .6-.5 1.6-1.4 2.6" />
                <path d="M6.7 7.5C4.5 9 3 11 3 12c0 1.5 4 6 9 6 1.6 0 3-.4 4.2-1" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </>
            ) : (
              <>
                <path d="M3 12c0-1.5 4-6 9-6s9 4.5 9 6-4 6-9 6-9-4.5-9-6Z" />
                <circle cx="12" cy="12" r="2.6" />
              </>
            )}
          </svg>
        </button>
      </div>
      {children}
      <Mensajes id={id} error={error} exito={exito} ayuda={ayuda} />
    </div>
  );
}

/** Barra de fortaleza de la contraseña (débil, media, fuerte). */
export function IndicadorFuerza({ contrasena }: { contrasena: string }) {
  if (!contrasena) return null;

  const tieneVariedad = /[A-Za-z]/.test(contrasena) && /\d/.test(contrasena);
  const nivel = contrasena.length >= 8 && tieneVariedad ? 3 : contrasena.length >= 6 ? 2 : 1;
  const etiqueta = nivel === 3 ? 'Fuerte' : nivel === 2 ? 'Media' : 'Débil';
  const nombreNivel = nivel === 3 ? 'fuerte' : nivel === 2 ? 'media' : 'debil';

  return (
    <div className="fuerza">
      <span className="fuerza-barras" aria-hidden="true">
        {[0, 1, 2].map((indice) => (
          <span key={indice} className={indice < nivel ? `nivel-${nombreNivel}` : ''} />
        ))}
      </span>
      <span className="fuerza-etiqueta">Contraseña {etiqueta.toLowerCase()}</span>
    </div>
  );
}

/** Aviso de error del servidor con el estilo de la aplicación. */
export function AlertaAuth({ mensaje }: { mensaje: string }) {
  if (!mensaje) return null;
  return (
    <div className="alerta-auth" role="alert">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
      </svg>
      <span>{mensaje}</span>
    </div>
  );
}
