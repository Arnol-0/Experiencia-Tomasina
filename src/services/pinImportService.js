import { validationService } from './validationService.js';

/**
 * ============================================================================
 * SERVICIO: pinImportService (Importación de pines horizontal y lista)
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
 * 📌 Formatos soportados:
 *
 * 1. Formato horizontal (Plantilla recomendada):
 *    | RUT          | Pin 1        | Pin 2     | Pin 3                   |
 *    | 12.345.678-5 | Voluntariado | Bienestar |                         |
 *    | 9.876.543-3  | Semana 0     | Liderazgo | Articulación            |
 *
 * 2. Formato lista / vertical (Retrocompatible):
 *    | RUT          | Pin                      |
 *    | 12.345.678-5 | Voluntariado             |
 *    | 12.345.678-5 | Bienestar                |
 */

/** 📌 Alias aceptados para columnas que contienen nombres de pines. */
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

/** 📌 Metadatos comunes de estudiantes para no confundir con pines. */
export const NON_PIN_COLUMN_ALIASES = [
  'rut',
  'id',
  'identificacion',
  'cedula',
  'nombre',
  'alumno',
  'estudiante',
  'nombre completo',
  'carrera',
  'grado',
  'programa',
  'jornada',
  'institucion',
  'tipo institucion',
  'sede',
  'campus',
  'email',
  'correo',
  'telefono',
  'fecha',
  'total pines obtenidos',
  'pines obtenidos',
  'total',
];

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

/** Determina si un encabezado de columna corresponde a un pin (ej: 'Pin 1', 'Pin 2', 'Pin', 'Pines', etc.). */
export const isPinColumn = (colName) => {
  if (!colName) return false;
  const norm = normalizeText(colName);
  if (NON_PIN_COLUMN_ALIASES.includes(norm)) return false;
  if (norm.startsWith('pin')) return true;
  if (PIN_COLUMN_ALIASES.includes(norm)) return true;
  // Encabezados repetidos convertidos por SheetJS a __EMPTY, __EMPTY_1, etc.
  if (/^__empty(_\d+)?$/i.test(String(colName).trim())) return true;
  return false;
};

/** Verifica si una fila o conjunto de columnas contiene al menos una columna de pines. */
export const hasPinColumn = (rowOrHeaders) => {
  const keys = Array.isArray(rowOrHeaders) ? rowOrHeaders : Object.keys(rowOrHeaders || {});
  return keys.some(isPinColumn);
};

/** Busca la clave real de la fila que coincida con alguno de los alias. */
export const findColumnKey = (row, aliases) => {
  const target = aliases.map(normalizeText);
  return Object.keys(row || {}).find((key) => target.includes(normalizeText(key)));
};

/**
 * Divide el contenido de una celda en tokens de búsqueda.
 * Permite que una celda contenga un solo pin o múltiples separados por coma/barra.
 */
export const splitPinTokens = (value) =>
  String(value ?? '')
    .split(/[,;|/\n\r\t]+|\s+y\s+/i)
    .map((token) => normalizeText(token))
    .filter(Boolean);

/**
 * Resuelve los ids de pin que menciona un texto.
 * Estrategia: coincidencia exacta por nombre o id; si no hay, coincidencias parciales.
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
 * Soporta tanto el formato horizontal (Pin 1, Pin 2, ...) como el formato vertical.
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

  // 📌 Índice RUT limpio -> estudiante
  const studentsByRut = new Map();
  students.forEach((student) => {
    const rut = validationService.cleanRut(student.rut || student.id);
    if (rut) studentsByRut.set(rut, student);
  });

  const planned = new Map(); // studentId -> { student, pins: Set, added: Set }

  rows.forEach((row) => {
    const rutKey = findColumnKey(row, RUT_COLUMN_ALIASES);
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

    // Buscamos todas las columnas de la fila que contienen pines
    const matchedIds = [];
    const unknownValuesInRow = [];

    Object.entries(row).forEach(([colKey, cellValue]) => {
      if (colKey === rutKey) return;
      if (!isPinColumn(colKey)) return;

      const rawVal = String(cellValue ?? '').trim();
      if (!rawVal) return;

      const ids = matchPinIds(rawVal, catalog);
      if (ids.length > 0) {
        matchedIds.push(...ids);
      } else {
        unknownValuesInRow.push(rawVal);
      }
    });

    if (!matchedIds.length) {
      if (unknownValuesInRow.length > 0) {
        result.unknownPins.push(...unknownValuesInRow);
      }
      result.rowsWithoutPins += 1;
      return;
    }

    if (unknownValuesInRow.length > 0) {
      result.unknownPins.push(...unknownValuesInRow);
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
  NON_PIN_COLUMN_ALIASES,
  isPinColumn,
  hasPinColumn,
  findColumnKey,
  normalizeText,
  splitPinTokens,
  matchPinIds,
  buildPinAssignments,
};

export default pinImportService;
