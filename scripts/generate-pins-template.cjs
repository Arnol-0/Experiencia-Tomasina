const XLSX = require('xlsx');
const path = require('path');

// 1. Hoja principal: Pines (formato horizontal celda a celda)
const pinesHeaders = [
  'RUT',
  'Pin 1',
  'Pin 2',
  'Pin 3',
  'Pin 4',
  'Pin 5',
  'Pin 6',
  'Pin 7',
  'Pin 8',
  'Pin 9',
  'Pin 10',
  'Pin 11',
  'Pin 12'
];

const pinesData = [
  pinesHeaders,
  ['12.345.678-5', 'Voluntariado', 'Bienestar', '', '', '', '', '', '', '', '', '', ''],
  ['9.876.543-3', 'Semana 0/Programa IVU', 'Articulación', 'Programa de Liderazgo', '', '', '', '', '', '', '', '', ''],
  ['11.222.333-4', 'Proyectos Estudiantiles', 'Centro de Aprendizaje', 'Vinculación con el Medio', '', '', '', '', '', '', '', '', ''],
  ['15.678.901-2', 'Orientación Profesional', '', '', '', '', '', '', '', '', '', '', '']
];

const wsPines = XLSX.utils.aoa_to_sheet(pinesData);

// Ancho de columnas para excelente visualización en Excel
wsPines['!cols'] = [
  { wch: 16 }, // RUT
  { wch: 26 }, // Pin 1
  { wch: 26 }, // Pin 2
  { wch: 26 }, // Pin 3
  { wch: 26 }, // Pin 4
  { wch: 26 }, // Pin 5
  { wch: 26 }, // Pin 6
  { wch: 26 }, // Pin 7
  { wch: 26 }, // Pin 8
  { wch: 26 }, // Pin 9
  { wch: 26 }, // Pin 10
  { wch: 26 }, // Pin 11
  { wch: 26 }  // Pin 12
];

// 2. Hoja secundaria: Pines válidos (catálogo institucional)
const pinesValidosData = [
  ['Nombres de Pin Válidos', 'Categoría', 'Descripción'],
  ['Semana 0/Programa IVU', 'Inducción', 'Programa de Inducción'],
  ['Articulación', 'Académico', 'Proceso de articulación'],
  ['Voluntariado', 'Social', 'Acción social comunitaria'],
  ['Proyectos Estudiantiles', 'Desarrollo', 'Iniciativas y fondos'],
  ['Bienestar', 'Salud', 'Salud mental y física'],
  ['Centro de Aprendizaje', 'Académico', 'Apoyo y tutorías'],
  ['Programa de Liderazgo', 'Liderazgo', 'Escuela de formación'],
  ['Orientación Profesional', 'Desarrollo', 'Acompañamiento laboral'],
  ['Estudiante Destacado/a', 'Reconocimiento', 'Reconocimiento al mérito'],
  ['Representantes Tomasin@s', 'Liderazgo', 'Vocería estudiantil'],
  ['Experiencia Internacional', 'Desarrollo', 'Intercambio y movilidad'],
  ['Vinculación con el Medio', 'Social', 'Impacto en el entorno']
];

const wsValidos = XLSX.utils.aoa_to_sheet(pinesValidosData);
wsValidos['!cols'] = [
  { wch: 30 },
  { wch: 18 },
  { wch: 35 }
];

// 3. Hoja de instrucciones claras
const instruccionesData = [
  ['PLANTILLA DE ASIGNACIÓN DE PINES - FORMATO HORIZONTAL'],
  [],
  ['Esta plantilla permite registrar los pines tomados por cada estudiante en una fila a lo largo.'],
  [],
  ['Instrucciones de llenado:'],
  ['1. Columna "RUT": Ingresa el RUT del alumno (con o sin puntos/guion). Debe estar previamente registrado en el sistema.'],
  ['2. Columnas "Pin 1", "Pin 2", "Pin 3", etc. (a lo largo de la fila):'],
  ['   - Escribe en cada cuadro/celda el nombre de UN pin que tomó el alumno.'],
  ['   - ¡No agrupes todos los pines en un solo cuadro! Cada celda corresponde a un pin individual.'],
  ['   - Si el estudiante tomó 2 pines, completa "Pin 1" y "Pin 2" y deja las siguientes celdas vacías.'],
  ['3. Consulta los nombres oficiales en la pestaña "Pines válidos".'],
  ['4. El sistema reconoce nombres parciales (ejemplo: "Liderazgo" o "Voluntariado").'],
  [],
  ['Ejemplo de estructura:'],
  ['RUT: 12.345.678-5  |  Pin 1: Voluntariado  |  Pin 2: Bienestar  |  Pin 3: (vacío)'],
  [],
  ['Formatos soportados para importación: .xlsx, .xls, .csv']
];

const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData);
wsInstrucciones['!cols'] = [{ wch: 90 }];

// Creamos el libro de trabajo con las hojas
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsPines, 'Pines');
XLSX.utils.book_append_sheet(wb, wsValidos, 'Pines válidos');
XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

const targetPath = path.resolve('public/plantillas/Plantilla_Pines.xlsx');
XLSX.writeFile(wb, targetPath);
console.log('Plantilla generada exitosamente en:', targetPath);
