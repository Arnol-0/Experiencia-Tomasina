/**
 * ============================================================================
 * SERVICIO: validationService (Validación de Formularios e Ingesta de Datos)
 * ============================================================================
 * 
 * 📌 PRINCIPIO SOLID: SRP (Single Responsibility Principle)
 * Este servicio centraliza toda la lógica de validación de entradas de usuario,
 * formatos (RUT, Correo, Campos requeridos) y verificación de integridad de
 * archivos Excel/CSV antes de interactuar con Firebase o el estado global.
 */

export const validationService = {
  /**
   * 1. Limpia y normaliza un RUT chileno
   * Quita puntos, guiones y espacios, dejando solo dígitos y la letra K en mayúscula.
   * Ejemplo: "12.345.678-k" -> "12345678K"
   */
  cleanRut: (rut) => {
    if (!rut) return '';
    return String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  },

  /**
   * 2. Da formato estándar a un RUT: XX.XXX.XXX-X
   */
  formatRut: (rut) => {
    const cleaned = validationService.cleanRut(rut);
    if (cleaned.length < 2) return cleaned;
    
    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);
    
    // Formatea con puntos
    let formattedBody = '';
    for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
      if (count > 0 && count % 3 === 0) {
        formattedBody = '.' + formattedBody;
      }
      formattedBody = body[i] + formattedBody;
    }
    
    return `${formattedBody}-${dv}`;
  },

  /**
   * 3. Valida el RUT chileno mediante el algoritmo del Dígito Verificador (Módulo 11)
   * 
   * @param {string} rut - El RUT con o sin puntos y guión
   * @returns {{ isValid: boolean, error?: string, cleaned: string, formatted: string }}
   */
  validateRut: (rut) => {
    const cleaned = validationService.cleanRut(rut);
    
    if (!cleaned) {
      return { isValid: false, error: 'El RUT es obligatorio.', cleaned: '', formatted: '' };
    }

    if (cleaned.length < 7 || cleaned.length > 9) {
      return { isValid: false, error: 'El RUT debe tener entre 7 y 9 caracteres (con dígito verificador).', cleaned, formatted: cleaned };
    }

    const body = cleaned.slice(0, -1);
    const dv = cleaned.slice(-1);

    // Verificación matemática Módulo 11
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i], 10) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = 11 - (sum % 11);
    let expectedDv = '';
    if (remainder === 11) expectedDv = '0';
    else if (remainder === 10) expectedDv = 'K';
    else expectedDv = String(remainder);

    if (dv !== expectedDv) {
      return { 
        isValid: false, 
        error: `Dígito verificador inválido. Se esperaba '${expectedDv}' para el número ingresado.`, 
        cleaned, 
        formatted: validationService.formatRut(cleaned) 
      };
    }

    return { 
      isValid: true, 
      cleaned, 
      formatted: validationService.formatRut(cleaned) 
    };
  },

  /**
   * 4. Valida el formato de una dirección de correo electrónico
   */
  validateEmail: (email) => {
    if (!email || !email.trim()) {
      return { isValid: false, error: 'El correo electrónico es obligatorio.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return { isValid: false, error: 'El formato del correo electrónico no es válido (ej: usuario@santotomas.cl).' };
    }
    return { isValid: true };
  },

  /**
   * 5. Valida campos obligatorios en un objeto
   */
  validateRequiredFields: (data, requiredFields) => {
    const missing = [];
    for (const [key, label] of Object.entries(requiredFields)) {
      const val = data[key];
      if (val === undefined || val === null || String(val).trim() === '') {
        missing.push(label);
      }
    }
    if (missing.length > 0) {
      return {
        isValid: false,
        error: `Los siguientes campos son obligatorios: ${missing.join(', ')}.`
      };
    }
    return { isValid: true };
  },

  /**
   * 6. Valida el archivo subido en el input file
   */
  validateExcelFile: (file) => {
    if (!file) {
      return { isValid: false, error: 'Por favor, selecciona un archivo.' };
    }

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileName = file.name.toLowerCase();
    const hasValidExt = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExt) {
      return { 
        isValid: false, 
        error: `Formato de archivo no admitido (${file.name}). Sube un archivo con extensión .xlsx, .xls o .csv.` 
      };
    }

    // Tamaño máximo: 15 MB
    const MAX_SIZE = 15 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return { isValid: false, error: 'El archivo excede el tamaño máximo permitido de 15 MB.' };
    }

    return { isValid: true };
  },

  /**
   * 7. Valida la estructura y contenido del archivo Excel para Estudiantes
   * Verifica que contenga filas válidas y las columnas mínimas necesarias.
   */
  validateExcelStudentsStructure: (rows, importBranch = 'Auto') => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { 
        isValid: false, 
        error: 'El archivo Excel está vacío o la hoja de cálculo seleccionada no tiene datos.',
        validRows: []
      };
    }

    // Función auxiliar para buscar nombres de columnas normalizados
    const findColumnValue = (row, possibleNames) => {
      const key = Object.keys(row).find(k => 
        possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
      );
      return key ? row[key] : undefined;
    };

    // Verificamos si al menos una fila contiene columnas de Nombre o RUT
    const firstRow = rows[0];
    const hasRutCol = findColumnValue(firstRow, ['rut', 'id', 'identificacion', 'cedula']) !== undefined;
    const hasNameCol = findColumnValue(firstRow, ['nombre', 'nombres', 'estudiante', 'alumno']) !== undefined;

    if (!hasRutCol && !hasNameCol) {
      return {
        isValid: false,
        error: 'El archivo no contiene las columnas requeridas. Debe incluir al menos una columna con el "RUT" o el "Nombre" de los estudiantes.',
        validRows: []
      };
    }

    const validRows = [];
    const invalidRows = [];
    let rutsWithFormatWarning = 0;

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // +2 considerando cabecera en fila 1
      const rawRut = findColumnValue(row, ['rut', 'id', 'identificacion', 'cedula']);
      const rawName = findColumnValue(row, ['nombre', 'nombres', 'estudiante', 'alumno']);
      const rawGrade = findColumnValue(row, ['carrera', 'programa']);
      const rawJornada = findColumnValue(row, ['jornada', 'turno']);
      const rawInst = findColumnValue(row, ['institucion', 'institución', 'tipo']);
      const rawBranch = findColumnValue(row, ['sede', 'branch', 'campus', 'sucursal']);

      // Si la fila está completamente vacía, la omitimos
      const hasAnyData = Object.values(row).some(v => v !== null && v !== undefined && String(v).trim() !== '');
      if (!hasAnyData) return;

      // Se requiere al menos un nombre o un RUT válido
      if (!rawName && !rawRut) {
        invalidRows.push({ row: rowNum, reason: 'Falta tanto el Nombre como el RUT' });
        return;
      }

      // Validamos el RUT si viene presente
      let rutValidation = { isValid: true, cleaned: '', formatted: '' };
      if (rawRut) {
        rutValidation = validationService.validateRut(rawRut);
        if (!rutValidation.isValid) {
          rutsWithFormatWarning++;
        }
      }

      const finalBranch = importBranch === 'Auto' 
        ? (rawBranch ? String(rawBranch).trim() : 'Sin Sede Asignada') 
        : importBranch;

      validRows.push({
        id: rutValidation.cleaned || (rawRut ? String(rawRut).trim() : `imported-${Date.now()}-${idx}`),
        rut: rutValidation.formatted || (rawRut ? String(rawRut).trim() : ''),
        name: rawName ? String(rawName).trim() : 'Sin Nombre',
        grade: rawGrade ? String(rawGrade).trim() : 'Sin carrera',
        jornada: rawJornada ? String(rawJornada).trim() : '',
        branch: finalBranch,
        institutionType: rawInst ? String(rawInst).trim() : '',
        bio: 'Estudiante Tomasino'
      });
    });

    if (validRows.length === 0) {
      return {
        isValid: false,
        error: 'No se encontraron filas con información válida de estudiantes en el archivo.',
        validRows: []
      };
    }

    return {
      isValid: true,
      validRows,
      invalidCount: invalidRows.length,
      rutsWithFormatWarning,
      totalProcessed: rows.length
    };
  }
};
