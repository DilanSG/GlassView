import { Link, useLocation } from 'react-router-dom';
import { useSesion } from '../contextos/SesionContexto';

/** Franja que avisa del estado de la prueba gratuita o del plan vencido. */
export default function AvisoPrueba() {
  const { usuario } = useSesion();
  const ubicacion = useLocation();

  if (!usuario || ubicacion.pathname === '/facturacion') {
    return null;
  }

  const { estado } = usuario;

  if (estado.motivo === 'expirado') {
    return (
      <div className="aviso-plan aviso-plan-expirado" role="alert">
        <span>Tu prueba gratuita terminó. Activa tu suscripción para seguir creando planos.</span>
        <Link to="/facturacion" className="aviso-plan-accion">
          Activar plan
        </Link>
      </div>
    );
  }

  if (estado.motivo === 'prueba') {
    const dias = estado.diasPruebaRestantes;
    return (
      <div className="aviso-plan aviso-plan-prueba" role="status">
        <span>
          {dias === 1 ? 'Te queda 1 día de prueba gratuita.' : `Te quedan ${dias} días de prueba gratuita.`}
        </span>
        <Link to="/facturacion" className="aviso-plan-accion">
          Ver plan
        </Link>
      </div>
    );
  }

  return null;
}
