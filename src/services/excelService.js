import * as XLSX from 'xlsx';
import { PINS_CATALOG } from '../pages/StudentProfile'; // Reutiliza el catálogo oficial de pines
import { validationService } from './validationService';

/**
 * ============================================================================
 * SERVICIO: excelService (Importación, Procesamiento y Exportación de Excel)
 * ============================================================================
 * 
 * 📌 PRINCIPIO SOLID APLICADO:
 * 1. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Este archivo es el ÚNICO lugar del proyecto donde se procesan archivos Excel.
 *    Si cambia el formato de lectura de XLSX o la lógica de mapeo de columnas,
 *    solo se modifica este archivo. La interfaz de usuario (Dashboard, Directory)
 *    no sabe ni le importa cómo funciona la librería 'xlsx'.
 * 
 * 2. DIP (Dependency Inversion Principle - Inversión de Dependencias):
 *    Los componentes no dependen directamente de la biblioteca externa 'xlsx',
 *    sino de la interfaz limpia que expone 'excelService'.
 */
export const excelService = {
  /**
   * 1. Parsea un archivo Excel subido por el usuario (.xlsx, .xls, .csv)
   * Valida previamente el archivo y lo convierte en un arreglo de objetos JSON.
   * 
   * @param {File} file - El archivo binario seleccionado en el input
   * @returns {Promise<Array>} - Promesa con la lista de filas como objetos
   */
  parseExcelFile: (file) => {
    return new Promise((resolve, reject) => {
      // Validación previa de archivo (existencia, extensión permitida y tamaño)
      const fileValidation = validationService.validateExcelFile(file);
      if (!fileValidation.isValid) {
        return reject(new Error(fileValidation.error));
      }

      const reader = new FileReader();
      
      // Cuando el navegador termina de leer el archivo en memoria binaria:
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          // Lee el libro de trabajo de forma segura
          const wb = XLSX.read(bstr, { type: 'binary' });
          if (!wb || !wb.SheetNames || wb.SheetNames.length === 0) {
            return reject(new Error("El archivo Excel está dañado o no contiene hojas legibles."));
          }

          const wsname = wb.SheetNames[0]; // Tomamos la primera hoja del Excel
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws, { defval: "" }); // Convertimos filas a JSON sin perder celdas vacías
          resolve(data);
        } catch (error) {
          reject(new Error("No se pudo leer el archivo Excel. Asegúrate de que no esté corrupto ni protegido con contraseña."));
        }
      };
      
      reader.onerror = () => reject(new Error("Error de lectura al acceder al archivo desde el navegador."));
      reader.readAsBinaryString(file);
    });
  },


  /**
   * 2. Función auxiliar tolerante a variaciones en los nombres de columnas
   * Permite buscar un campo aunque el Excel tenga tildes, mayúsculas o espacios distintos
   * (por ejemplo: 'RUT', 'Rut', 'Identificación', 'Cédula').
   * 
   * Normaliza quitando tildes: "Institución" -> "institucion"
   */
  getValFromRow: (row, possibleNames) => {
    const key = Object.keys(row).find(k => 
      possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
    );
    return key ? row[key] : undefined;
  },

  /**
   * 3. Exporta una lista de estudiantes y sus pines a un archivo descargable Excel (.xlsx)
   * 
   * @param {Array} studentsList - Lista de estudiantes con sus atributos
   * @param {String} fileName - Nombre del archivo a descargar
   */
  exportToExcel: (studentsList, fileName = 'Estudiantes_TuViajeST.xlsx') => {
    // Estructuramos las columnas amigables para el usuario final en Excel
    const exportData = studentsList.map(student => ({
      Rut: student.rut || (student.id && !student.id.startsWith('imported-') && !student.id.startsWith('manual-') ? student.id : ''),
      Nombre: student.name || '',
      Carrera: student.grade || '',
      Jornada: student.jornada || '',
      Institucion: student.institutionType || '',
      Sede: student.branch || 'Sin Sede Asignada',
      // Traducimos los IDs de pines a sus nombres oficiales legibles
      'Pines Disponibles': (student.availablePins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      }).join(', '),
      'Pines Obtenidos': (student.collectedPins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      }).join(', ')
    }));

    // Creamos la hoja de cálculo y generamos la descarga automática
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(wb, fileName);
  }
};

