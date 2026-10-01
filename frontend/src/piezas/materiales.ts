import type { MaterialPieza } from '../tipos';

/**
 * Materiales de partida del taller: los aluminios, vidrios, acrílicos y
 * herrajes habituales. El usuario puede crear los suyos y quedan guardados
 * en el navegador para reutilizarlos en cualquier pieza.
 */
export const MATERIALES_PREDEFINIDOS: MaterialPieza[] = [
  { id: 'aluminio-natural', nombre: 'Aluminio natural', color: '#d7dade', tipo: 'perfil' },
  { id: 'aluminio-blanco', nombre: 'Aluminio blanco', color: '#f1f2f4', tipo: 'perfil' },
  { id: 'aluminio-negro', nombre: 'Aluminio negro', color: '#3b3e43', tipo: 'perfil' },
  { id: 'aluminio-bronce', nombre: 'Aluminio bronce', color: '#6f5538', tipo: 'perfil' },
  { id: 'vidrio-claro', nombre: 'Vidrio claro', color: '#bcd9ea', tipo: 'vidrio' },
  { id: 'vidrio-bronce', nombre: 'Vidrio bronce', color: '#b98a5a', tipo: 'vidrio' },
  { id: 'vidrio-gris', nombre: 'Vidrio gris', color: '#9aa4ab', tipo: 'vidrio' },
  { id: 'acrilico-transparente', nombre: 'Acrílico transparente', color: '#bfe3e8', tipo: 'acrilico' },
  { id: 'acrilico-blanco', nombre: 'Acrílico blanco', color: '#eef4f5', tipo: 'acrilico' },
  { id: 'acero-inox', nombre: 'Acero inoxidable', color: '#b9c0c7', tipo: 'herraje' },
  { id: 'herraje-negro', nombre: 'Herraje negro', color: '#2f3237', tipo: 'herraje' },
];

const CLAVE_MATERIALES = 'glassview-materiales';

/** Materiales propios del usuario, guardados en este navegador. */
export function cargarMaterialesPropios(): MaterialPieza[] {
  try {
    const bruto = localStorage.getItem(CLAVE_MATERIALES);
    if (!bruto) return [];
    const lista = JSON.parse(bruto) as MaterialPieza[];
    return Array.isArray(lista) ? lista.filter((material) => material?.nombre && material?.color) : [];
  } catch {
    return [];
  }
}

export function guardarMaterialPropio(material: MaterialPieza): void {
  const actuales = cargarMaterialesPropios().filter((actual) => actual.id !== material.id);
  localStorage.setItem(CLAVE_MATERIALES, JSON.stringify([...actuales, material]));
}

export function buscarMaterial(nombre: string | undefined): MaterialPieza | undefined {
  if (!nombre) return undefined;
  return [...MATERIALES_PREDEFINIDOS, ...cargarMaterialesPropios()].find(
    (material) => material.nombre === nombre,
  );
}
