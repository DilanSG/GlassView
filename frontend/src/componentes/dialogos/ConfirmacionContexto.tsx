import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import DialogoConfirmacion, { type OpcionesConfirmacion } from './DialogoConfirmacion';

type Confirmar = (opciones: OpcionesConfirmacion) => Promise<boolean>;

const ContextoConfirmacion = createContext<Confirmar | null>(null);

/**
 * Abre el diálogo de confirmación de la app y espera la respuesta:
 * `if (!(await confirmar({ ... }))) return;`
 */
export function useConfirmacion(): Confirmar {
  const confirmar = useContext(ContextoConfirmacion);
  if (!confirmar) {
    throw new Error('useConfirmacion debe usarse dentro de ProveedorConfirmacion.');
  }
  return confirmar;
}

interface PeticionConfirmacion extends OpcionesConfirmacion {
  resolver: (confirmado: boolean) => void;
}

/** Provee el diálogo de confirmación a toda la aplicación. */
export function ProveedorConfirmacion({ children }: { children: ReactNode }): JSX.Element {
  const [peticion, setPeticion] = useState<PeticionConfirmacion | null>(null);

  const confirmar = useCallback<Confirmar>(
    (opciones) =>
      new Promise<boolean>((resolver) => {
        setPeticion({ ...opciones, resolver });
      }),
    [],
  );

  function responder(confirmado: boolean): void {
    if (!peticion) return;
    setPeticion(null);
    peticion.resolver(confirmado);
  }

  return (
    <ContextoConfirmacion.Provider value={confirmar}>
      {children}
      {peticion && <DialogoConfirmacion opciones={peticion} onResponder={responder} />}
    </ContextoConfirmacion.Provider>
  );
}
