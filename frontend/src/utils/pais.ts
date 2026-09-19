/**
 * Zona horaria IANA → código ISO del país (solo países soportados).
 */
const PAIS_POR_ZONA: Record<string, string> = {
  'America/Bogota': 'CO',
  'America/Mexico_City': 'MX',
  'America/Monterrey': 'MX',
  'America/Mazatlan': 'MX',
  'America/Cancun': 'MX',
  'America/Chihuahua': 'MX',
  'America/Tijuana': 'MX',
  'America/Merida': 'MX',
  'America/Argentina/Buenos_Aires': 'AR',
  'America/Argentina/Cordoba': 'AR',
  'America/Argentina/Mendoza': 'AR',
  'America/Santiago': 'CL',
  'Pacific/Easter': 'CL',
  'America/Lima': 'PE',
  'America/Caracas': 'VE',
  'America/Guayaquil': 'EC',
  'America/La_Paz': 'BO',
  'America/Asuncion': 'PY',
  'America/Montevideo': 'UY',
  'America/Sao_Paulo': 'BR',
  'America/Bahia': 'BR',
  'America/Fortaleza': 'BR',
  'America/Recife': 'BR',
  'America/Manaus': 'BR',
  'America/Belem': 'BR',
  'America/Cuiaba': 'BR',
  'America/Porto_Velho': 'BR',
  'America/Costa_Rica': 'CR',
  'America/Panama': 'PA',
  'America/Santo_Domingo': 'DO',
  'America/Guatemala': 'GT',
  'America/Tegucigalpa': 'HN',
  'America/El_Salvador': 'SV',
  'America/Managua': 'NI',
  'America/Havana': 'CU',
  'America/Puerto_Rico': 'PR',
  'Europe/Madrid': 'ES',
  'Atlantic/Canary': 'ES',
  'Europe/Lisbon': 'PT',
  'Atlantic/Azores': 'PT',
  'America/New_York': 'US',
  'America/Chicago': 'US',
  'America/Denver': 'US',
  'America/Los_Angeles': 'US',
  'America/Phoenix': 'US',
  'America/Anchorage': 'US',
  'Pacific/Honolulu': 'US',
  'America/Toronto': 'CA',
  'America/Vancouver': 'CA',
  'America/Edmonton': 'CA',
  'America/Winnipeg': 'CA',
  'America/Halifax': 'CA',
  'Europe/London': 'GB',
  'Europe/Paris': 'FR',
  'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT',
  'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE',
  'Europe/Dublin': 'IE',
  'Europe/Zurich': 'CH',
  'Asia/Tokyo': 'JP',
  'Asia/Shanghai': 'CN',
  'Asia/Kolkata': 'IN',
  'Australia/Sydney': 'AU',
  'Australia/Melbourne': 'AU',
  'Australia/Brisbane': 'AU',
  'Australia/Perth': 'AU',
  'Australia/Adelaide': 'AU',
};

function normalizar(codigo: unknown): string | null {
  if (typeof codigo !== 'string') {
    return null;
  }
  const valor = codigo.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(valor) ? valor : null;
}

/**
 * Estima el país del visitante con la zona horaria y el idioma del navegador.
 * Sirve como pista para la API; la detección definitiva la hace el backend.
 */
export function detectarPaisAproximado(): string {
  if (typeof window !== 'undefined') {
    try {
      const zona = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const porZona = zona ? PAIS_POR_ZONA[zona] : undefined;
      if (porZona) {
        return porZona;
      }
    } catch {
      // Sin soporte de zonas horarias: se continúa con el idioma.
    }

    for (const idioma of navigator.languages ?? [navigator.language]) {
      const region = idioma?.split('-')[1];
      const codigo = normalizar(region);
      if (codigo) {
        return codigo;
      }
    }
  }

  return '';
}
