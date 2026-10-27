const XLSX = require('xlsx');
const path = require('path');

// 1. Hoja principal: Pines (formato horizontal celda a celda + Lanyard y Pasaporte + Sede)
const pinesHeaders = [
  'RUT',
  'Nombre',
  'Sede',
  'Lanyard',
  'Pasaporte',
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
  ['12.345.678-5', 'Ana Rojas', 'Santiago', 'Sí', 'Sí', 'Voluntariado', 'Bienestar', '', '', '', '', '', '', '', '', '', ''],
  ['9.876.543-3', 'Pedro Soto', 'Viña del Mar', 'Sí', 'Sí', 'Semana 0/Programa IVU', 'Articulación', 'Programa de Liderazgo', '', '', '', '', '', '', '', '', ''],
  ['11.222.333-4', 'Claudia Morales', 'Concepción', 'Sí', 'Sí', 'Proyectos Estudiantiles', 'Centro de Aprendizaje', 'Vinculación con el Medio', '', '', '', '', '', '', '', '', ''],
  ['15.678.901-2', 'Felipe Araya', 'La Serena', 'Sí', 'Sí', 'Orientación Profesional', '', '', '', '', '', '', '', '', '', '', '']
];

const wsPines = XLSX.utils.aoa_to_sheet(pinesData);

// Ancho de columnas para excelente visualización en Excel
wsPines['!cols'] = [
  { wch: 16 }, // RUT
  { wch: 22 }, // Nombre
  { wch: 18 }, // Sede
  { wch: 12 }, // Lanyard
  { wch: 12 }, // Pasaporte
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
  ['PLANTILLA DE LLENADO AUTOMÁTICO DE PINES, LANYARD Y PASAPORTE'],
  [],
  ['Esta plantilla permite registrar y actualizar pines y credenciales para estudiantes de UNA O VARIAS SEDES a la vez.'],
  [],
  ['Instrucciones de llenado:'],
  ['1. Columna "RUT": Ingresa el RUT del alumno (con o sin puntos/guion).'],
  ['2. Columna "Nombre" (opcional): Nombre del alumno.'],
  ['3. Columna "Sede" (opcional): Sede a la que pertenece el alumno (permite mezclar varias sedes en el mismo archivo).'],
  ['4. Columnas "Lanyard" y "Pasaporte": Escribe "Sí", "X", "1" o "Entregado" si se le entregó la credencial (o deja vacío si no).'],
  ['5. Columnas "Pin 1", "Pin 2", "Pin 3", etc. (a lo largo de la fila):'],
  ['   - Escribe en cada cuadro/celda el nombre de UN pin que ganó o tomó el estudiante.'],
  ['   - ¡No agrupes todos los pines en un solo cuadro! Cada celda corresponde a un pin individual.'],
  ['   - Si el estudiante tomó 2 pines, completa "Pin 1" y "Pin 2" y deja las siguientes celdas vacías.'],
  ['6. Consulta los nombres oficiales en la pestaña "Pines válidos". Se aceptan nombres parciales (ejemplo: "Liderazgo" o "Voluntariado").'],
  [],
  ['Formatos soportados para importación: .xlsx, .xls, .csv']
];

const wsInstrucciones = XLSX.utils.aoa_to_sheet(instruccionesData);
wsInstrucciones['!cols'] = [{ wch: 95 }];

// Creamos el libro de trabajo con las hojas
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsPines, 'Pines y Credenciales');
XLSX.utils.book_append_sheet(wb, wsValidos, 'Pines válidos');
XLSX.utils.book_append_sheet(wb, wsInstrucciones, 'Instrucciones');

const targetPath = path.resolve('public/plantillas/Plantilla_Pines.xlsx');
XLSX.writeFile(wb, targetPath);
console.log('Plantilla generada exitosamente en:', targetPath);
