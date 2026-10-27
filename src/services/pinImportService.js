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
 * 1. Formato horizontal con credenciales y sedes (Plantilla recomendada):
 *    | RUT          | Nombre     | Sede      | Lanyard | Pasaporte | Pin 1        | Pin 2     |
 *    | 12.345.678-5 | Ana Rojas  | Santiago  | Sí      | Sí        | Voluntariado | Bienestar |
 *    | 9.876.543-3  | Pedro Soto | Viña      | Sí      | Sí        | Semana 0     | Liderazgo |
 *
 * 2. Formato horizontal clásico:
 *    | RUT          | Pin 1        | Pin 2     |
 *    | 12.345.678-5 | Voluntariado | Bienestar |
 *
 * 3. Formato lista / vertical (Retrocompatible):
 *    | RUT          | Pin          |
 *    | 12.345.678-5 | Voluntariado |
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

/** 📌 Alias aceptados para la columna de Lanyard. */
export const LANYARD_COLUMN_ALIASES = [
  'lanyard',
  'credencial',
  'lanyard entregado',
  'entrega lanyard',
  'tiene lanyard',
  'portacredencial'
];

/** 📌 Alias aceptados para la columna de Pasaporte. */
export const PASSPORT_COLUMN_ALIASES = [
  'pasaporte',
  'passport',
  'pasaporte entregado',
  'entrega pasaporte',
  'tiene pasaporte'
];

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
  'sucursal',
  'email',
  'correo',
  'telefono',
  'fecha',
  'total pines obtenidos',
  'pines obtenidos',
  'total',
  'lanyard',
  'credencial',
  'pasaporte',
  'passport'
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

/** Comprueba si un valor es afirmativo ('si', 'sí', '1', 'x', 'true', 'entregado', 'ok') */
export const isAffirmative = (val) => {
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  const s = normalizeText(val);
  return ['si', 's', 'yes', 'y', '1', 'x', 'true', 'entregado', 'ok', 'listo'].includes(s);
};

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
 * Modo clásico (asigna pines disponibles).
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

/**
 * ============================================================================
 * LLENADO AUTOMÁTICO EN TIEMPO REAL (Pines, Lanyard, Pasaporte y Multi-Sede)
 * ============================================================================
 * 
 * Permite actualizar pines obtenidos/ganados y registrar entrega de credenciales
 * (Lanyard y Pasaporte) para estudiantes de una o múltiples sedes a la vez.
 *
 * @param {Array<Object>} rows Filas leídas del Excel
 * @param {Array<Object>} students Lista de estudiantes existentes en Firestore
 * @param {Array<Object>} catalog Catálogo de pines oficial
 * @param {Object} options Opciones de configuración del llenado automático
 * @returns {Object} Plan detallado con actualizaciones, estadísticas y desglose por sede
 */
export const buildAutomaticFillPlan = (rows, students, catalog, options = {}) => {
  const {
    markAsCollected = true,        // Completa y desbloquea directamente el pin (collectedPins)
    deliverLanyardOption = true,   // Entrega Lanyard a los alumnos si no hay columna en el Excel
    deliverPassportOption = true,  // Entrega Pasaporte a los alumnos si no hay columna en el Excel
    autoCreateStudents = true,     // Si no existe, crea al estudiante si viene Nombre/Sede
    operatorEmail = 'Llenado Automático'
  } = options;

  const result = {
    updates: [],
    newStudentsCount: 0,
    updatedStudentsCount: 0,
    totalPinsAdded: 0,
    totalLanyardsDelivered: 0,
    totalPassportsDelivered: 0,
    sedesBreakdown: {},
    unknownPins: [],
    rowsWithoutRut: 0,
    rowsWithoutStudent: 0,
    totalRows: Array.isArray(rows) ? rows.length : 0,
  };

  if (!Array.isArray(rows) || rows.length === 0) return result;

  // Índice de búsqueda rápida por RUT normalizado
  const studentsByRut = new Map();
  students.forEach((student) => {
    const rut = validationService.cleanRut(student.rut || student.id);
    if (rut) studentsByRut.set(rut, student);
  });

  // Inspección de encabezados en la primera fila para saber si hay columnas de credenciales
  const firstRow = rows[0] || {};
  const fileHasLanyardCol = Boolean(findColumnKey(firstRow, LANYARD_COLUMN_ALIASES));
  const fileHasPassportCol = Boolean(findColumnKey(firstRow, PASSPORT_COLUMN_ALIASES));

  const planned = new Map(); // studentId -> plan

  rows.forEach((row) => {
    const rutKey = findColumnKey(row, RUT_COLUMN_ALIASES);
    const rawRut = String(row?.[rutKey] ?? '').trim();
    if (!rawRut) {
      result.rowsWithoutRut += 1;
      return;
    }

    const cleanRut = validationService.cleanRut(rawRut);
    const formattedRut = validationService.formatRut(cleanRut);
    let student = studentsByRut.get(cleanRut);
    let isNew = false;

    if (!student) {
      if (!autoCreateStudents) {
        result.rowsWithoutStudent += 1;
        return;
      }

      // Si no existe, extraemos metadatos de la fila si están presentes
      const nameKey = findColumnKey(row, ['nombre', 'estudiante', 'alumno', 'nombre completo']);
      const branchKey = findColumnKey(row, ['sede', 'campus', 'sucursal']);
      const gradeKey = findColumnKey(row, ['carrera', 'grado', 'programa']);
      const jornadaKey = findColumnKey(row, ['jornada']);
      const institutionKey = findColumnKey(row, ['institucion', 'tipo institucion']);

      const rowName = String(row?.[nameKey] ?? '').trim();
      const rowBranch = String(row?.[branchKey] ?? '').trim();
      const rowGrade = String(row?.[gradeKey] ?? '').trim();
      const rowJornada = String(row?.[jornadaKey] ?? 'Diurna').trim();
      const rowInstitution = String(row?.[institutionKey] ?? 'UST').trim();

      const newId = `imported-${cleanRut}`;
      student = {
        id: newId,
        rut: formattedRut,
        name: rowName || `Estudiante ${formattedRut}`,
        branch: rowBranch || 'Sin Sede Asignada',
        grade: rowGrade || 'Sin Carrera Asignada',
        jornada: rowJornada,
        institutionType: rowInstitution,
        collectedPins: [],
        availablePins: [],
        unlockRecords: {},
        credentials: {},
      };
      isNew = true;
      studentsByRut.set(cleanRut, student);
    }

    // 1. Detección de Lanyard y Pasaporte en columnas específicas
    const lanyardColKey = findColumnKey(row, LANYARD_COLUMN_ALIASES);
    const passportColKey = findColumnKey(row, PASSPORT_COLUMN_ALIASES);

    let rowWantsLanyard = false;
    let rowWantsPassport = false;

    if (lanyardColKey) {
      rowWantsLanyard = isAffirmative(row[lanyardColKey]);
    }
    if (passportColKey) {
      rowWantsPassport = isAffirmative(row[passportColKey]);
    }

    // 2. Detección de Pines (y credenciales escritas en celdas de pines)
    const matchedPinIds = [];
    Object.entries(row).forEach(([colKey, cellVal]) => {
      if (colKey === rutKey || colKey === lanyardColKey || colKey === passportColKey) return;
      if (!isPinColumn(colKey)) return;

      const rawVal = String(cellVal ?? '').trim();
      if (!rawVal) return;

      const norm = normalizeText(rawVal);
      if (norm === 'lanyard' || norm === 'credencial') {
        rowWantsLanyard = true;
        return;
      }
      if (norm === 'pasaporte' || norm === 'passport') {
        rowWantsPassport = true;
        return;
      }

      const ids = matchPinIds(rawVal, catalog);
      if (ids.length > 0) {
        matchedPinIds.push(...ids);
      } else {
        result.unknownPins.push(rawVal);
      }
    });

    // Decidir entrega de credenciales
    const shouldDeliverLanyard = fileHasLanyardCol ? rowWantsLanyard : (rowWantsLanyard || deliverLanyardOption);
    const shouldDeliverPassport = fileHasPassportCol ? rowWantsPassport : (rowWantsPassport || deliverPassportOption);

    let plan = planned.get(student.id);
    if (!plan) {
      plan = {
        student,
        isNew,
        collectedPins: new Set(student.collectedPins || []),
        availablePins: new Set(student.availablePins || []),
        unlockRecords: { ...(student.unlockRecords || {}) },
        credentials: { ...(student.credentials || {}) },
        addedCollected: new Set(),
        addedAvailable: new Set(),
        lanyardDelivered: false,
        passportDelivered: false,
      };
      planned.set(student.id, plan);
    }

    // Procesar pines
    matchedPinIds.forEach((pinId) => {
      if (markAsCollected) {
        if (!plan.collectedPins.has(pinId)) {
          plan.collectedPins.add(pinId);
          plan.addedCollected.add(pinId);
          plan.availablePins.delete(pinId);
          const pinObj = catalog.find((p) => p.id === pinId);
          plan.unlockRecords[pinId] = {
            date: new Date().toISOString(),
            activity: pinObj?.options?.[0] || 'Llenado Automático Excel',
          };
        }
      } else {
        if (!plan.availablePins.has(pinId) && !plan.collectedPins.has(pinId)) {
          plan.availablePins.add(pinId);
          plan.addedAvailable.add(pinId);
        }
      }
    });

    // Procesar Lanyard
    if (shouldDeliverLanyard && !plan.credentials?.lanyard?.delivered) {
      plan.credentials.lanyard = {
        delivered: true,
        deliveredAt: new Date().toISOString(),
        deliveredBy: operatorEmail,
      };
      plan.lanyardDelivered = true;
    }

    // Procesar Pasaporte
    if (shouldDeliverPassport && !plan.credentials?.passport?.delivered) {
      plan.credentials.passport = {
        delivered: true,
        deliveredAt: new Date().toISOString(),
        deliveredBy: operatorEmail,
      };
      plan.passportDelivered = true;
    }
  });

  // Generamos la lista de actualizaciones consolidadas
  planned.forEach((plan) => {
    const hasPinChanges = plan.addedCollected.size > 0 || plan.addedAvailable.size > 0;
    const hasCredChanges = plan.lanyardDelivered || plan.passportDelivered;

    if (plan.isNew || hasPinChanges || hasCredChanges) {
      const payload = {
        collectedPins: [...plan.collectedPins],
        availablePins: [...plan.availablePins],
        unlockRecords: plan.unlockRecords,
        credentials: plan.credentials,
      };

      if (plan.isNew) {
        payload.id = plan.student.id;
        payload.rut = plan.student.rut;
        payload.name = plan.student.name;
        payload.branch = plan.student.branch;
        payload.grade = plan.student.grade;
        payload.jornada = plan.student.jornada;
        payload.institutionType = plan.student.institutionType;
        payload.createdAt = new Date().toISOString();
        result.newStudentsCount += 1;
      } else {
        result.updatedStudentsCount += 1;
      }

      const totalPinsAddedForStudent = plan.addedCollected.size + plan.addedAvailable.size;
      result.totalPinsAdded += totalPinsAddedForStudent;
      if (plan.lanyardDelivered) result.totalLanyardsDelivered += 1;
      if (plan.passportDelivered) result.totalPassportsDelivered += 1;

      const branch = plan.student.branch || 'Sin Sede Asignada';
      result.sedesBreakdown[branch] = (result.sedesBreakdown[branch] || 0) + 1;

      result.updates.push({
        studentId: plan.student.id,
        isNew: plan.isNew,
        rut: plan.student.rut,
        name: plan.student.name,
        branch: plan.student.branch,
        addedPins: [...plan.addedCollected, ...plan.addedAvailable],
        lanyardDelivered: plan.lanyardDelivered,
        passportDelivered: plan.passportDelivered,
        payload,
      });
    }
  });

  return result;
};

export const pinImportService = {
  PIN_COLUMN_ALIASES,
  RUT_COLUMN_ALIASES,
  LANYARD_COLUMN_ALIASES,
  PASSPORT_COLUMN_ALIASES,
  NON_PIN_COLUMN_ALIASES,
  isAffirmative,
  isPinColumn,
  hasPinColumn,
  findColumnKey,
  normalizeText,
  splitPinTokens,
  matchPinIds,
  buildPinAssignments,
  buildAutomaticFillPlan,
};

export default pinImportService;
