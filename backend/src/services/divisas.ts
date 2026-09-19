import type { Request } from 'express';

export interface InfoPais {
  nombre: string;
  moneda: string;
  simbolo: string;
  locale: string;
}

export interface TasaCambio {
  tasa: number;
  fuente: 'base' | 'vivo' | 'respaldo';
  actualizado: string | null;
}

/** Países soportados para mostrar el precio localizado de la suscripción. */
export const PAISES: Record<string, InfoPais> = {
  US: { nombre: 'Estados Unidos', moneda: 'USD', simbolo: '$', locale: 'en-US' },
  MX: { nombre: 'México', moneda: 'MXN', simbolo: '$', locale: 'es-MX' },
  CO: { nombre: 'Colombia', moneda: 'COP', simbolo: '$', locale: 'es-CO' },
  AR: { nombre: 'Argentina', moneda: 'ARS', simbolo: '$', locale: 'es-AR' },
  CL: { nombre: 'Chile', moneda: 'CLP', simbolo: '$', locale: 'es-CL' },
  PE: { nombre: 'Perú', moneda: 'PEN', simbolo: 'S/', locale: 'es-PE' },
  VE: { nombre: 'Venezuela', moneda: 'VES', simbolo: 'Bs.', locale: 'es-VE' },
  EC: { nombre: 'Ecuador', moneda: 'USD', simbolo: '$', locale: 'es-EC' },
  BO: { nombre: 'Bolivia', moneda: 'BOB', simbolo: 'Bs', locale: 'es-BO' },
  PY: { nombre: 'Paraguay', moneda: 'PYG', simbolo: '₲', locale: 'es-PY' },
  UY: { nombre: 'Uruguay', moneda: 'UYU', simbolo: '$', locale: 'es-UY' },
  BR: { nombre: 'Brasil', moneda: 'BRL', simbolo: 'R$', locale: 'pt-BR' },
  CR: { nombre: 'Costa Rica', moneda: 'CRC', simbolo: '₡', locale: 'es-CR' },
  PA: { nombre: 'Panamá', moneda: 'USD', simbolo: '$', locale: 'es-PA' },
  DO: { nombre: 'República Dominicana', moneda: 'DOP', simbolo: 'RD$', locale: 'es-DO' },
  GT: { nombre: 'Guatemala', moneda: 'GTQ', simbolo: 'Q', locale: 'es-GT' },
  HN: { nombre: 'Honduras', moneda: 'HNL', simbolo: 'L', locale: 'es-HN' },
  SV: { nombre: 'El Salvador', moneda: 'USD', simbolo: '$', locale: 'es-SV' },
  NI: { nombre: 'Nicaragua', moneda: 'NIO', simbolo: 'C$', locale: 'es-NI' },
  CU: { nombre: 'Cuba', moneda: 'CUP', simbolo: '$', locale: 'es-CU' },
  PR: { nombre: 'Puerto Rico', moneda: 'USD', simbolo: '$', locale: 'es-PR' },
  ES: { nombre: 'España', moneda: 'EUR', simbolo: '€', locale: 'es-ES' },
  PT: { nombre: 'Portugal', moneda: 'EUR', simbolo: '€', locale: 'pt-PT' },
  FR: { nombre: 'Francia', moneda: 'EUR', simbolo: '€', locale: 'fr-FR' },
  DE: { nombre: 'Alemania', moneda: 'EUR', simbolo: '€', locale: 'de-DE' },
  IT: { nombre: 'Italia', moneda: 'EUR', simbolo: '€', locale: 'it-IT' },
  NL: { nombre: 'Países Bajos', moneda: 'EUR', simbolo: '€', locale: 'nl-NL' },
  BE: { nombre: 'Bélgica', moneda: 'EUR', simbolo: '€', locale: 'nl-BE' },
  IE: { nombre: 'Irlanda', moneda: 'EUR', simbolo: '€', locale: 'en-IE' },
  GB: { nombre: 'Reino Unido', moneda: 'GBP', simbolo: '£', locale: 'en-GB' },
  CA: { nombre: 'Canadá', moneda: 'CAD', simbolo: 'CA$', locale: 'en-CA' },
  CH: { nombre: 'Suiza', moneda: 'CHF', simbolo: 'CHF', locale: 'de-CH' },
  JP: { nombre: 'Japón', moneda: 'JPY', simbolo: '¥', locale: 'ja-JP' },
  CN: { nombre: 'China', moneda: 'CNY', simbolo: '¥', locale: 'zh-CN' },
  IN: { nombre: 'India', moneda: 'INR', simbolo: '₹', locale: 'en-IN' },
  AU: { nombre: 'Australia', moneda: 'AUD', simbolo: 'A$', locale: 'en-AU' },
};

const PAIS_POR_DEFECTO = 'US';

/**
 * Tasas de respaldo (moneda local por 1 USD) usadas solo si la API de tipos
 * de cambio no responde. Se actualizan solas cuando la API vuelve a estar en línea.
 */
const TASAS_RESPALDO: Record<string, number> = {
  USD: 1,
  MXN: 18.5,
  COP: 4100,
  ARS: 1100,
  CLP: 950,
  PEN: 3.75,
  VES: 40,
  BOB: 6.9,
  PYG: 7500,
  UYU: 42,
  BRL: 5.4,
  CRC: 510,
  DOP: 60,
  GTQ: 7.7,
  HNL: 25,
  NIO: 36.8,
  CUP: 24,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.37,
  CHF: 0.88,
  JPY: 147,
  CNY: 7.1,
  INR: 84,
  AUD: 1.52,
};

const URL_TASAS = 'https://open.er-api.com/v6/latest/USD';
const DURACION_CACHE_TASAS = 12 * 60 * 60 * 1000;
const DURACION_CACHE_FALLO = 5 * 60 * 1000;
const DURACION_CACHE_PAIS = 24 * 60 * 60 * 1000;

interface CacheTasas {
  obtenidoEn: number;
  tasas: Record<string, number>;
}

let cacheTasas: CacheTasas | null = null;
let reintentoDesde = 0;
const cachePaises = new Map<string, { pais: string; expiraEn: number }>();

/** Devuelve la información del país o la de EE. UU. como respaldo. */
export function obtenerInfoPais(codigo: string): InfoPais {
  return PAISES[codigo] ?? PAISES[PAIS_POR_DEFECTO];
}

/** Convierte de USD a la moneda indicada usando la API en vivo o el respaldo. */
export async function obtenerTasaCambio(moneda: string): Promise<TasaCambio> {
  if (moneda === 'USD') {
    return { tasa: 1, fuente: 'base', actualizado: null };
  }

  const cache = await obtenerTasas();

  if (cache) {
    const tasa = cache.tasas[moneda];
    if (typeof tasa === 'number' && tasa > 0) {
      return {
        tasa,
        fuente: 'vivo',
        actualizado: new Date(cache.obtenidoEn).toISOString(),
      };
    }
  }

  return {
    tasa: TASAS_RESPALDO[moneda] ?? 1,
    fuente: 'respaldo',
    actualizado: null,
  };
}

async function obtenerTasas(): Promise<CacheTasas | null> {
  const ahora = Date.now();
  if (cacheTasas && ahora - cacheTasas.obtenidoEn < DURACION_CACHE_TASAS) {
    return cacheTasas;
  }
  // Si la API falló hace poco, no se reintenta en cada petición: se usa el
  // respaldo local hasta que pase el enfriamiento.
  if (ahora < reintentoDesde) {
    return null;
  }

  try {
    const respuesta = await fetch(URL_TASAS, { signal: AbortSignal.timeout(5000) });
    if (!respuesta.ok) {
      reintentoDesde = Date.now() + DURACION_CACHE_FALLO;
      return null;
    }
    const cuerpo = (await respuesta.json()) as {
      result?: string;
      rates?: Record<string, number>;
    };
    if (cuerpo.result !== 'success' || !cuerpo.rates) {
      reintentoDesde = Date.now() + DURACION_CACHE_FALLO;
      return null;
    }
    cacheTasas = { obtenidoEn: ahora, tasas: cuerpo.rates };
    reintentoDesde = 0;
    return cacheTasas;
  } catch {
    reintentoDesde = Date.now() + DURACION_CACHE_FALLO;
    return null;
  }
}

/**
 * Detecta el país desde el que se compra: primero un parámetro explícito,
 * luego las cabeceras geográficas del proxy, después la ubicación por IP y
 * por último el idioma del navegador.
 */
export async function detectarPais(req: Request): Promise<string> {
  const porParametro = normalizarPais(req.query.pais);
  if (porParametro) {
    return porParametro;
  }

  const cuerpo = req.body as Record<string, unknown> | undefined;
  const porCuerpo = normalizarPais(cuerpo?.pais);
  if (porCuerpo) {
    return porCuerpo;
  }

  for (const cabecera of ['cf-ipcountry', 'x-vercel-ip-country', 'x-country-code']) {
    const porCabecera = normalizarPais(req.header(cabecera));
    if (porCabecera) {
      return porCabecera;
    }
  }

  const porIp = await paisPorIp(obtenerIpCliente(req));
  if (porIp) {
    return porIp;
  }

  return paisPorIdioma(req.header('accept-language'));
}

function normalizarPais(valor: unknown): string | null {
  if (typeof valor !== 'string') {
    return null;
  }
  const codigo = valor.trim().toUpperCase();
  return codigo.length === 2 && codigo in PAISES ? codigo : null;
}

function obtenerIpCliente(req: Request): string | null {
  const reenviada = req.header('x-forwarded-for');
  const ip = (reenviada ? reenviada.split(',')[0] : req.ip)?.trim();
  if (!ip) {
    return null;
  }
  return ip.replace(/^::ffff:/, '');
}

function esIpPrivada(ip: string): boolean {
  return (
    ip === '::1' ||
    ip === '127.0.0.1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

async function paisPorIp(ip: string | null): Promise<string | null> {
  if (!ip || esIpPrivada(ip)) {
    return null;
  }

  const enCache = cachePaises.get(ip);
  if (enCache && enCache.expiraEn > Date.now()) {
    return enCache.pais;
  }

  try {
    const respuesta = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country/`, {
      signal: AbortSignal.timeout(3500),
    });
    if (!respuesta.ok) {
      return null;
    }
    const pais = normalizarPais(await respuesta.text());
    if (!pais) {
      return null;
    }
    if (cachePaises.size > 2000) {
      cachePaises.clear();
    }
    cachePaises.set(ip, { pais, expiraEn: Date.now() + DURACION_CACHE_PAIS });
    return pais;
  } catch {
    return null;
  }
}

function paisPorIdioma(cabecera: string | undefined): string {
  if (cabecera) {
    for (const idioma of cabecera.split(',')) {
      const region = idioma.trim().split(';')[0].split('-')[1];
      const pais = normalizarPais(region);
      if (pais) {
        return pais;
      }
    }
  }
  return PAIS_POR_DEFECTO;
}

/** Monedas que se cobran sin decimales. */
const MONEDAS_SIN_DECIMALES = new Set(['COP', 'CLP', 'PYG', 'VES', 'JPY', 'KRW', 'VND', 'IDR']);

/** Redondea el precio local según los decimales habituales de la moneda. */
export function redondearPrecio(valor: number, moneda: string): number {
  if (MONEDAS_SIN_DECIMALES.has(moneda)) {
    const factor = valor >= 10000 ? 100 : 10;
    return Math.round(valor / factor) * factor;
  }

  return Math.round(valor * 100) / 100;
}
