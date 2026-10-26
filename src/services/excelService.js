import * as XLSX from 'xlsx';
import { PINS_CATALOG } from '../constants/pinsCatalog';
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
        } catch (err) {
          console.error("Error al procesar archivo Excel:", err);
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
   * 📌 Formato horizontal: cada cuadro/celda contiene un pin individual a lo largo de la fila
   * para evitar agrupar todos los nombres de pines dentro de un solo cuadro.
   * 
   * @param {Array} studentsList - Lista de estudiantes con sus atributos
   * @param {String} fileName - Nombre del archivo a descargar
   */
  exportToExcel: (studentsList, fileName = 'Estudiantes_TuViajeST.xlsx') => {
    // Determinamos la cantidad máxima de pines obtenidos para dimensionar las columnas dinámicas
    let maxCollected = 1;
    studentsList.forEach(student => {
      const count = (student.collectedPins || []).length;
      if (count > maxCollected) maxCollected = count;
    });

    // Estructuramos las columnas amigables con formato horizontal
    const exportData = studentsList.map(student => {
      const row = {
        Rut: student.rut || (student.id && !student.id.startsWith('imported-') && !student.id.startsWith('manual-') ? student.id : ''),
        Nombre: student.name || '',
        Carrera: student.grade || '',
        Jornada: student.jornada || '',
        Institucion: student.institutionType || '',
        Sede: student.branch || 'Sin Sede Asignada',
        'Total Pines Obtenidos': (student.collectedPins || []).length,
      };

      // Traducimos los IDs de pines a sus nombres oficiales legibles
      const collectedNames = (student.collectedPins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      });

      // Fila a lo largo: cada cuadro dice cada pin que tomó el estudiante
      for (let i = 0; i < maxCollected; i++) {
        row[`Pin ${i + 1}`] = collectedNames[i] || '';
      }

      return row;
    });

    // Creamos la hoja de cálculo y generamos la descarga automática
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes y Pines");
    XLSX.writeFile(wb, fileName);
  },

  /**
   * 4. Exporta únicamente la matriz de pines por RUT en formato horizontal:
   * | RUT | Nombre | Sede | Pin 1 | Pin 2 | Pin 3 | ... |
   * 
   * @param {Array} studentsList - Lista de estudiantes
   * @param {String} fileName - Nombre del archivo a descargar
   */
  exportPinsToExcel: (studentsList, fileName = 'Pines_Tomados_TuViajeST.xlsx') => {
    let maxCollected = 1;
    studentsList.forEach(student => {
      const count = (student.collectedPins || []).length;
      if (count > maxCollected) maxCollected = count;
    });

    const exportData = studentsList.map(student => {
      const row = {
        Rut: student.rut || (student.id && !student.id.startsWith('imported-') && !student.id.startsWith('manual-') ? student.id : ''),
        Nombre: student.name || '',
        Sede: student.branch || 'Sin Sede Asignada',
        Carrera: student.grade || '',
        'Total Tomados': (student.collectedPins || []).length,
      };

      const collectedNames = (student.collectedPins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      });

      for (let i = 0; i < maxCollected; i++) {
        row[`Pin ${i + 1}`] = collectedNames[i] || '';
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pines por RUT");
    XLSX.writeFile(wb, fileName);
  }
};

export default excelService;
