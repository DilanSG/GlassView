import type { HydratedDocument } from 'mongoose';
import { variablesEntorno } from '../config/variablesEntorno.js';
import type { Usuario } from '../models/Usuario.js';

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

export type MotivoAcceso = 'prueba' | 'suscripcion' | 'expirado' | 'bloqueado';

export interface EstadoAcceso {
  enPrueba: boolean;
  diasPruebaRestantes: number;
  pruebaHasta: string;
  suscripcionActiva: boolean;
  suscripcionHasta: string | null;
  permiteAcceso: boolean;
  motivo: MotivoAcceso;
  precioUsd: number;
}

export interface UsuarioPublico {
  _id: string;
  nombre: string;
  email: string;
  rol: 'usuario' | 'admin';
  activo: boolean;
  fechaRegistro: string | null;
  pruebaHasta: string;
  suscripcion: {
    activa: boolean;
    fechaInicio: string | null;
    fechaFin: string | null;
    ultimoPago: string | null;
  };
  pagos: Array<{
    fecha: string | null;
    montoUsd: number;
    moneda: string;
    montoLocal: number;
    referencia: string;
  }>;
  pais?: string;
  moneda?: string;
  estado: EstadoAcceso;
}

type UsuarioDocumento = HydratedDocument<Usuario>;

/** Calcula si la cuenta puede usar las funciones según prueba o suscripción. */
export function calcularEstadoAcceso(usuario: UsuarioDocumento): EstadoAcceso {
  const ahora = Date.now();
  const pruebaHasta = usuario.pruebaHasta.getTime();
  const fechaFinSuscripcion = usuario.suscripcion?.fechaFin?.getTime() ?? 0;
  const suscripcionActiva = Boolean(usuario.suscripcion?.activa) && fechaFinSuscripcion > ahora;

  let motivo: MotivoAcceso;
  if (!usuario.activo) {
    motivo = 'bloqueado';
  } else if (suscripcionActiva) {
    motivo = 'suscripcion';
  } else if (pruebaHasta > ahora) {
    motivo = 'prueba';
  } else {
    motivo = 'expirado';
  }

  return {
    enPrueba: motivo === 'prueba',
    diasPruebaRestantes:
      motivo === 'prueba' ? Math.ceil((pruebaHasta - ahora) / MILISEGUNDOS_DIA) : 0,
    pruebaHasta: usuario.pruebaHasta.toISOString(),
    suscripcionActiva,
    suscripcionHasta: suscripcionActiva
      ? new Date(fechaFinSuscripcion).toISOString()
      : null,
    permiteAcceso: motivo === 'prueba' || motivo === 'suscripcion',
    motivo,
    precioUsd: variablesEntorno.precioUsd,
  };
}

/** Convierte el documento de usuario a un objeto seguro (sin hash). */
export function usuarioPublico(usuario: UsuarioDocumento): UsuarioPublico {
  return {
    _id: usuario._id.toString(),
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
    fechaRegistro: usuario.fechaRegistro?.toISOString() ?? null,
    pruebaHasta: usuario.pruebaHasta.toISOString(),
    suscripcion: {
      activa: Boolean(usuario.suscripcion?.activa),
      fechaInicio: usuario.suscripcion?.fechaInicio?.toISOString() ?? null,
      fechaFin: usuario.suscripcion?.fechaFin?.toISOString() ?? null,
      ultimoPago: usuario.suscripcion?.ultimoPago?.toISOString() ?? null,
    },
    pagos: (usuario.pagos ?? []).map((pago) => ({
      fecha: pago.fecha?.toISOString() ?? null,
      montoUsd: pago.montoUsd,
      moneda: pago.moneda,
      montoLocal: pago.montoLocal,
      referencia: pago.referencia,
    })),
    pais: usuario.pais ?? undefined,
    moneda: usuario.moneda ?? undefined,
    estado: calcularEstadoAcceso(usuario),
  };
}
