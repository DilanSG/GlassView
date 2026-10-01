import type { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { PiezaPersonalizada } from '../models/PiezaPersonalizada.js';

const TIPOS = ['perfil', 'vidrio', 'acrilico', 'herraje'] as const;
const CATEGORIAS = [
  'cabezal',
  'sillar',
  'jamba',
  'horizontal',
  'hoja',
  'riel',
  'canal-u',
  'rodachina',
  'manija',
  'empaque',
  'otro',
] as const;

interface PuntoForma {
  x: number;
  y: number;
}

interface TrazoForma {
  rol: 'contorno' | 'vacio';
  visible: boolean;
  nombre?: string;
  puntos: PuntoForma[];
  material?: { nombre: string; color: string };
}

interface FormaNormalizada {
  anchoCm: number;
  altoCm: number;
  color?: string;
  trazos: TrazoForma[];
}

const COLOR_VALIDO = /^#[0-9a-f]{3,8}$/i;

function limpiarTexto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : '';
}

/** Normaliza el material guardado en la pieza (nombre y color). */
function normalizarMaterial(valor: unknown): { nombre: string; color: string } | undefined {
  if (!valor || typeof valor !== 'object') {
    return undefined;
  }
  const bruto = valor as { nombre?: unknown; color?: unknown };
  const nombre = limpiarTexto(bruto.nombre).slice(0, 60);
  const color = limpiarTexto(bruto.color);
  if (nombre.length < 2 || !COLOR_VALIDO.test(color)) {
    return undefined;
  }
  return { nombre, color };
}

function redondearCm(valor: number): number {
  return Math.round(valor * 10) / 10;
}

/** Valida y sanea la forma: medidas, trazos cerrados y puntos dentro del lienzo. */
function normalizarForma(valor: unknown): FormaNormalizada | null {
  if (!valor || typeof valor !== 'object') {
    return null;
  }
  const bruto = valor as { anchoCm?: unknown; altoCm?: unknown; color?: unknown; trazos?: unknown };
  const anchoCm = Number(bruto.anchoCm);
  const altoCm = Number(bruto.altoCm);
  if (!Number.isFinite(anchoCm) || !Number.isFinite(altoCm) || anchoCm < 0.5 || altoCm < 0.5) {
    return null;
  }
  if (anchoCm > 500 || altoCm > 500 || !Array.isArray(bruto.trazos)) {
    return null;
  }

  const trazos: TrazoForma[] = [];
  for (const trazoBruto of bruto.trazos) {
    if (!trazoBruto || typeof trazoBruto !== 'object') continue;
    const { rol, visible, nombre, puntos, material } = trazoBruto as {
      rol?: unknown;
      visible?: unknown;
      nombre?: unknown;
      puntos?: unknown;
      material?: unknown;
    };
    if (!Array.isArray(puntos)) continue;
    const saneados: PuntoForma[] = [];
    for (const punto of puntos) {
      if (!punto || typeof punto !== 'object') continue;
      const x = Number((punto as { x?: unknown }).x);
      const y = Number((punto as { y?: unknown }).y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      saneados.push({
        x: redondearCm(Math.min(Math.max(0, x), anchoCm)),
        y: redondearCm(Math.min(Math.max(0, y), altoCm)),
      });
    }
    if (saneados.length < 3) continue;
    const materialCapa = normalizarMaterial(material);
    const nombreCapa = limpiarTexto(nombre).slice(0, 40);
    trazos.push({
      rol: rol === 'vacio' ? 'vacio' : 'contorno',
      visible: visible !== false,
      ...(nombreCapa.length >= 2 ? { nombre: nombreCapa } : {}),
      puntos: saneados,
      ...(materialCapa ? { material: materialCapa } : {}),
    });
  }

  if (!trazos.some((trazo) => trazo.rol === 'contorno')) {
    return null;
  }
  const color = limpiarTexto(bruto.color);
  return {
    anchoCm: redondearCm(anchoCm),
    altoCm: redondearCm(altoCm),
    ...(COLOR_VALIDO.test(color) ? { color } : {}),
    trazos,
  };
}

function generarRef(): string {
  return `CUS-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function normalizarEspesor(valor: unknown): number {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return 4;
  }
  return Math.min(Math.max(1, Math.round(numero * 10) / 10), 30);
}

/** Lista las piezas propias y las públicas de las demás cuentas. */
export async function listarPiezasPersonalizadas(req: Request, res: Response): Promise<void> {
  try {
    const piezas = await PiezaPersonalizada.find({
      $or: [{ usuario: req.usuario!._id }, { publico: true }],
    }).sort({ createdAt: -1 });
    res.json({ exito: true, datos: piezas, mensaje: 'Piezas personalizadas cargadas.' });
  } catch {
    res
      .status(500)
      .json({ exito: false, datos: null, mensaje: 'Error al cargar las piezas personalizadas.' });
  }
}

/** Crea una pieza personalizada; la REF se genera si no se indica. */
export async function crearPiezaPersonalizada(req: Request, res: Response): Promise<void> {
  const nombre = limpiarTexto(req.body?.nombre);
  const ref = limpiarTexto(req.body?.ref).toUpperCase();
  const tipo = limpiarTexto(req.body?.tipo) || 'perfil';
  const categoria = limpiarTexto(req.body?.categoria) || 'otro';
  const publico = req.body?.publico === true;
  const espesorMm = normalizarEspesor(req.body?.espesorMm);
  const material = normalizarMaterial(req.body?.material);
  const forma = normalizarForma(req.body?.forma);

  if (nombre.length < 2) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'La pieza necesita un nombre.' });
    return;
  }
  if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'El tipo de pieza no es válido.' });
    return;
  }
  if (!CATEGORIAS.includes(categoria as (typeof CATEGORIAS)[number])) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'La categoría no es válida.' });
    return;
  }
  if (!forma) {
    res.status(400).json({
      exito: false,
      datos: null,
      mensaje: 'Dibuja al menos un contorno con tres puntos para guardar la pieza.',
    });
    return;
  }

  try {
    let referencia = ref || generarRef();
    for (let intento = 0; intento < 5; intento += 1) {
      const existente = await PiezaPersonalizada.exists({ usuario: req.usuario!._id, ref: referencia });
      if (!existente) break;
      referencia = generarRef();
    }

    const pieza = await PiezaPersonalizada.create({
      usuario: req.usuario!._id,
      nombre,
      ref: referencia,
      tipo,
      categoria,
      publico,
      espesorMm,
      material,
      forma,
    });
    res.status(201).json({ exito: true, datos: pieza, mensaje: 'Pieza personalizada creada.' });
  } catch {
    res
      .status(500)
      .json({ exito: false, datos: null, mensaje: 'No se pudo crear la pieza personalizada.' });
  }
}

/** Actualiza una pieza propia (nombre, REF, tipo, categoría, visibilidad o forma). */
export async function actualizarPiezaPersonalizada(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador no válido.' });
    return;
  }

  try {
    const pieza = await PiezaPersonalizada.findOne({
      _id: req.params.id,
      usuario: req.usuario!._id,
    });
    if (!pieza) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Pieza no encontrada.' });
      return;
    }

    if (req.body?.nombre !== undefined) {
      const nombre = limpiarTexto(req.body.nombre);
      if (nombre.length < 2) {
        res.status(400).json({ exito: false, datos: null, mensaje: 'La pieza necesita un nombre.' });
        return;
      }
      pieza.nombre = nombre;
    }
    if (req.body?.ref !== undefined) {
      const ref = limpiarTexto(req.body.ref).toUpperCase();
      if (!ref) {
        res.status(400).json({ exito: false, datos: null, mensaje: 'La REF no puede quedar vacía.' });
        return;
      }
      const existente = await PiezaPersonalizada.exists({
        usuario: req.usuario!._id,
        ref,
        _id: { $ne: pieza._id },
      });
      if (existente) {
        res.status(409).json({ exito: false, datos: null, mensaje: 'Ya tienes una pieza con esa REF.' });
        return;
      }
      pieza.ref = ref;
    }
    if (req.body?.tipo !== undefined) {
      const tipo = limpiarTexto(req.body.tipo);
      if (!TIPOS.includes(tipo as (typeof TIPOS)[number])) {
        res.status(400).json({ exito: false, datos: null, mensaje: 'El tipo de pieza no es válido.' });
        return;
      }
      pieza.tipo = tipo as (typeof TIPOS)[number];
    }
    if (req.body?.categoria !== undefined) {
      const categoria = limpiarTexto(req.body.categoria);
      if (!CATEGORIAS.includes(categoria as (typeof CATEGORIAS)[number])) {
        res.status(400).json({ exito: false, datos: null, mensaje: 'La categoría no es válida.' });
        return;
      }
      pieza.categoria = categoria as (typeof CATEGORIAS)[number];
    }
    if (req.body?.publico !== undefined) {
      pieza.publico = req.body.publico === true;
    }
    if (req.body?.espesorMm !== undefined) {
      pieza.espesorMm = normalizarEspesor(req.body.espesorMm);
    }
    if (req.body?.material !== undefined) {
      pieza.set('material', normalizarMaterial(req.body.material));
    }
    if (req.body?.forma !== undefined) {
      const forma = normalizarForma(req.body.forma);
      if (!forma) {
        res.status(400).json({
          exito: false,
          datos: null,
          mensaje: 'Dibuja al menos un contorno con tres puntos para guardar la pieza.',
        });
        return;
      }
      pieza.set('forma', forma);
    }

    await pieza.save();
    res.json({ exito: true, datos: pieza, mensaje: 'Pieza personalizada actualizada.' });
  } catch {
    res
      .status(500)
      .json({ exito: false, datos: null, mensaje: 'No se pudo actualizar la pieza personalizada.' });
  }
}

/** Elimina una pieza propia de la biblioteca. */
export async function eliminarPiezaPersonalizada(req: Request, res: Response): Promise<void> {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json({ exito: false, datos: null, mensaje: 'Identificador no válido.' });
    return;
  }

  try {
    const pieza = await PiezaPersonalizada.findOneAndDelete({
      _id: req.params.id,
      usuario: req.usuario!._id,
    });
    if (!pieza) {
      res.status(404).json({ exito: false, datos: null, mensaje: 'Pieza no encontrada.' });
      return;
    }
    res.json({ exito: true, datos: null, mensaje: 'Pieza personalizada eliminada.' });
  } catch {
    res
      .status(500)
      .json({ exito: false, datos: null, mensaje: 'No se pudo eliminar la pieza personalizada.' });
  }
}
