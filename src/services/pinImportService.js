import { validationService } from './validationService.js';

/**
 * ============================================================================
 * SERVICIO: pinImportService (Importación de pines en modo lista)
 * ============================================================================
 *
 * 📌 SRP (Single Responsibility Principle):
 * Este servicio solo transforma filas de un Excel en asignaciones de pines.
 * No modifica Firestore, no toca React y no conoce la UI: devuelve un plan de
 * actualizaciones que el Dashboard se encarga de persistir.
 *
 * 📌 DIP (Dependency Inversion Principle):
 * El catálogo de pines se recibe por parámetro en lugar de importarse aquí,
 * de modo que el servicio no depende de una página de React.
 *
 * 📌 Formato esperado (modo lista):
 *   | RUT           | Pin                      |
 *   | 12.345.678-5  | Voluntariado             |
 *   | 12.345.678-5  | Bienestar                |
 *   | 9.876.543-3   | Liderazgo, Articulación  |
 *
 * - La columna del pin se reconoce por varios alias (ver PIN_COLUMN_ALIASES).
 * - El alumno solo escribe el NOMBRE del pin; no necesita marcar x/1/sí.
 * - Un mismo RUT puede repetirse en varias filas y una celda puede traer
 *   varios pines separados por coma, punto y coma, barra, guion o salto de línea.
 * - Se aceptan nombres parciales ("Liderazgo" → "Programa de Liderazgo").
 */

/** 📌 Alias aceptados para la columna que contiene el/los nombre(s) del pin. */
export const PIN_COLUMN_ALIASES = [
  'pin',
  'pines',
  'pin disponible',
  'pines disponibles',
  'pin a asignar',
  'pines a asignar',
  'nombre del pin',
  'nombre pin',
  'pines activos',
  'disponibles',
];

/** 📌 Alias aceptados para la columna del RUT. */
export const RUT_COLUMN_ALIASES = ['rut', 'id', 'identificacion', 'cedula'];

/** 📌 Largo mínimo de un texto para intentar una coincidencia parcial. */
const MIN_PARTIAL_LENGTH = 3;

/** Normaliza un texto: minúsculas, sin tildes, '@' → 'o' y espacios simples. */
export const normalizeText = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/@/g, 'o')
    .replace(/\s+/g, ' ')
    .trim();

/** Busca la clave real de la fila que coincida con alguno de los alias. */
const findColumnKey = (row, aliases) => {
  const target = aliases.map(normalizeText);
  return Object.keys(row || {}).find((key) => target.includes(normalizeText(key)));
};

/**
 * Divide el contenido de una celda en tokens de búsqueda.
 * 📌 Se separa por comas, punto y coma, barras, pipes, saltos de línea y la
 * conjunción " y ", para permitir tanto una pin por fila como varios en una celda.
 */
export const splitPinTokens = (value) =>
  String(value ?? '')
    .split(/[,;|/\n\r\t]+|\s+y\s+/i)
    .map((token) => normalizeText(token))
    .filter(Boolean);

/**
 * Resuelve los ids de pin que menciona un texto.
 * 📌 Estrategia: primero coincidencia exacta por nombre o id; si no hay ninguna,
 * se aceptan coincidencias parciales (nombre completo dentro del token o al revés).
 */
export const matchPinIds = (value, catalog) => {
  const tokens = splitPinTokens(value);
  if (!tokens.length) return [];

  const exactMatches = new Set();
  const partialMatches = new Set();

  tokens.forEach((token) => {
    catalog.forEach((pin) => {
      const pinName = normalizeText(pin.name);
      const pinId = normalizeText(pin.id);

      if (token === pinName || token === pinId) {
        exactMatches.add(pin.id);
        return;
      }

      if (token.length < MIN_PARTIAL_LENGTH) return;
      // 📌 Un token corto (3 letras, como "IVU") solo calza como palabra completa;
      // así se evita que "pro" active cualquier pin que contenga "programa".
      const isWordMatch = pinName.split(/[^a-z0-9]+/).includes(token);
      if (isWordMatch || pinName.includes(token) || token.includes(pinName)) {
        if (token.length > 3 || isWordMatch) partialMatches.add(pin.id);
      }
    });
  });

  return [...(exactMatches.size ? exactMatches : partialMatches)];
};

/**
 * Construye el plan de asignación de pines a partir de las filas del Excel.
 *
 * @param {Array<Object>} rows      Filas leídas de la primera hoja.
 * @param {Array<Object>} students  Estudiantes actuales (con id, rut, availablePins).
 * @param {Array<Object>} catalog   Catálogo de pines (id + name).
 * @returns {{
 *   updates: Array<{studentId: string, studentName: string, rut: string, availablePins: string[], addedPins: string[]}>,
 *   totalRows: number,
 *   rowsWithoutRut: number,
 *   rowsWithoutStudent: number,
 *   rowsWithoutPins: number,
 *   unknownPins: string[]
 * }}
 */
export const buildPinAssignments = (rows, students, catalog) => {
  const result = {
    updates: [],
    totalRows: Array.isArray(rows) ? rows.length : 0,
    rowsWithoutRut: 0,
    rowsWithoutStudent: 0,
    rowsWithoutPins: 0,
    unknownPins: [],
  };

  if (!Array.isArray(rows) || rows.length === 0) return result;

  // 📌 Índice RUT limpio -> estudiante, para no recorrer 6000 registros por fila.
  const studentsByRut = new Map();
  students.forEach((student) => {
    const rut = validationService.cleanRut(student.rut || student.id);
    if (rut) studentsByRut.set(rut, student);
  });

  const planned = new Map(); // studentId -> { student, pins: Set, added: Set }

  rows.forEach((row) => {
    const rutKey = findColumnKey(row, RUT_COLUMN_ALIASES);
    const pinKey = findColumnKey(row, PIN_COLUMN_ALIASES);

    const rawRut = String(row?.[rutKey] ?? '').trim();
    if (!rawRut) {
      result.rowsWithoutRut += 1;
      return;
    }

    const cleanRut = validationService.cleanRut(rawRut);
    const student = studentsByRut.get(cleanRut);
    if (!student) {
      result.rowsWithoutStudent += 1;
      return;
    }

    const matchedIds = matchPinIds(pinKey ? row[pinKey] : '', catalog);
    if (!matchedIds.length) {
      // 📌 Guardamos el texto para poder avisar qué nombres no se reconocieron.
      const rawValue = String(pinKey ? row[pinKey] : '').trim();
      if (rawValue) result.unknownPins.push(rawValue);
      result.rowsWithoutPins += 1;
      return;
    }

    const current = planned.get(student.id) || {
      student,
      pins: new Set(student.availablePins || []),
      added: new Set(),
    };

    matchedIds.forEach((pinId) => {
      if (!current.pins.has(pinId)) {
        current.pins.add(pinId);
        current.added.add(pinId);
      }
    });

    planned.set(student.id, current);
  });

  result.updates = [...planned.entries()]
    .filter(([, plan]) => plan.added.size > 0)
    .map(([studentId, plan]) => ({
      studentId,
      studentName: plan.student.name || '',
      rut: plan.student.rut || plan.student.id,
      availablePins: [...plan.pins],
      addedPins: [...plan.added],
    }));

  return result;
};

export const pinImportService = {
  PIN_COLUMN_ALIASES,
  RUT_COLUMN_ALIASES,
  normalizeText,
  splitPinTokens,
  matchPinIds,
  buildPinAssignments,
};

export default pinImportService;
