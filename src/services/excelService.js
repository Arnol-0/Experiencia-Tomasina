import * as XLSX from 'xlsx';
import { PINS_CATALOG } from '../pages/StudentProfile'; // Re-using catalog

export const excelService = {
  /**
   * Parses an Excel file and returns the data as JSON
   * @param {File} file 
   * @returns {Promise<Array>}
   */
  parseExcelFile: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsBinaryString(file);
    });
  },

  /**
   * Helper function to find a value in a row based on possible column names.
   */
  getValFromRow: (row, possibleNames) => {
    const key = Object.keys(row).find(k => 
      possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
    );
    return key ? row[key] : undefined;
  },

  /**
   * Exports an array of students to an Excel file and triggers download
   * @param {Array} studentsList 
   * @param {String} fileName 
   */
  exportToExcel: (studentsList, fileName = 'Estudiantes_TuViajeST.xlsx') => {
    const exportData = studentsList.map(student => ({
      Rut: student.rut || (student.id && !student.id.startsWith('imported-') && !student.id.startsWith('manual-') ? student.id : ''),
      Nombre: student.name || '',
      Carrera: student.grade || '',
      Jornada: student.jornada || '',
      Institucion: student.institutionType || '',
      Sede: student.branch || 'Sin Sede Asignada',
      'Pines Disponibles': (student.availablePins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      }).join(', '),
      'Pines Obtenidos': (student.collectedPins || []).map(id => {
        const p = PINS_CATALOG.find(x => x.id === id);
        return p ? p.name : id;
      }).join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Estudiantes");
    XLSX.writeFile(wb, fileName);
  }
};
