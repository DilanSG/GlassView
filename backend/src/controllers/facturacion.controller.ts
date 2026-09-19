import type { Request, Response } from 'express';
import { variablesEntorno } from '../config/variablesEntorno.js';
import { detectarPais, obtenerInfoPais, obtenerTasaCambio, redondearPrecio } from '../services/divisas.js';
import { usuarioPublico } from '../services/suscripcion.js';

const DIAS_PERIODO = 30;
const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;

/**
 * Precio público de la suscripción convertido a la moneda del país desde el
 * que se consulta. La landing lo muestra antes de registrarse.
 */
export async function obtenerPrecio(req: Request, res: Response): Promise<void> {
  const pais = await detectarPais(req);
  const info = obtenerInfoPais(pais);
  const { tasa, fuente, actualizado } = await obtenerTasaCambio(info.moneda);
  const precioLocal = redondearPrecio(variablesEntorno.precioUsd * tasa, info.moneda);

  res.json({
    exito: true,
    datos: {
      pais,
      paisNombre: info.nombre,
      moneda: info.moneda,
      simbolo: info.simbolo,
      locale: info.locale,
      precioUsd: variablesEntorno.precioUsd,
      precioLocal,
      tasa,
      fuente,
      actualizado,
      periodoDias: DIAS_PERIODO,
      diasPrueba: variablesEntorno.diasPrueba,
    },
    mensaje: 'Precio cargado.',
  });
}

/** Devuelve el estado de facturación del usuario autenticado. */
export function obtenerFacturacion(req: Request, res: Response): void {
  res.json({ exito: true, datos: usuarioPublico(req.usuario!), mensaje: 'Facturación cargada.' });
}

/**
 * Simula el pago de la suscripción y activa (o renueva) el período mensual.
 * La pasarela real se conectará en este mismo punto: hoy genera una
 * referencia de pago simulada y deja el comprobante en el usuario.
 */
export async function simularPago(req: Request, res: Response): Promise<void> {
  const usuario = req.usuario!;

  try {
    const pais = await detectarPais(req);
    const info = obtenerInfoPais(pais);
    const { tasa } = await obtenerTasaCambio(info.moneda);
    const montoLocal = redondearPrecio(variablesEntorno.precioUsd * tasa, info.moneda);

    const ahora = Date.now();
    const finActual = usuario.suscripcion?.fechaFin?.getTime() ?? 0;
    const base = Math.max(ahora, finActual);
    const fechaInicio = usuario.suscripcion?.fechaInicio ?? new Date(ahora);

    usuario.set('suscripcion', {
      activa: true,
      fechaInicio,
      fechaFin: new Date(base + DIAS_PERIODO * MILISEGUNDOS_DIA),
      ultimoPago: new Date(ahora),
    });
    usuario.pais = pais;
    usuario.moneda = info.moneda;
    usuario.pagos.push({
      fecha: new Date(ahora),
      montoUsd: variablesEntorno.precioUsd,
      moneda: info.moneda,
      montoLocal,
      referencia: `SIM-${ahora.toString(36).toUpperCase()}`,
    });

    await usuario.save();

    res.json({
      exito: true,
      datos: usuarioPublico(usuario),
      mensaje: 'Pago simulado correctamente. Tu suscripción está activa.',
    });
  } catch {
    res.status(500).json({ exito: false, datos: null, mensaje: 'No se pudo procesar el pago.' });
  }
}
