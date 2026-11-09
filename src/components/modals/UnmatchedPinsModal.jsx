import React, { useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import { 
  AlertTriangle, 
  Download, 
  Search, 
  CheckCircle, 
  FileSpreadsheet, 
  Users,
  Info,
  X
} from 'lucide-react';
import { excelService } from '../../services/excelService';
import './UnmatchedPinsModal.css';

/**
 * ============================================================================
 * MODAL: UnmatchedPinsModal (Estudiantes/Pines No Coincidentes)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE ESTE MODAL?
 * Despliega el listado detallado de filas del Excel cuyo RUT no coincidió
 * con ningún estudiante registrado durante la importación de pines.
 *
 * 📌 CARACTERÍSTICAS PRINCIPALES:
 * 1. Visualización clara de cada fila no encontrada (RUT, Nombre, Sede, Pines).
 * 2. Buscador en tiempo real para localizar rápidamente a un alumno.
 * 3. Descarga directa en Excel (.xlsx) con el formato oficial del reporte.
 * 4. Métricas resumen del proceso (filas procesadas vs asignadas).
 */
const UnmatchedPinsModal = ({ isOpen, onClose, data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const rows = data?.rows || [];
  const fileName = data?.fileName || 'Archivo_Pines.xlsx';
  const totalAssigned = data?.totalAssigned || 0;

  // Filtrado reactivo en tiempo real
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase().trim();

    return rows.filter(item => {
      return (
        (item.rut && item.rut.toLowerCase().includes(term)) ||
        (item.cleanRut && item.cleanRut.toLowerCase().includes(term)) ||
        (item.formattedRut && item.formattedRut.toLowerCase().includes(term)) ||
        (item.name && item.name.toLowerCase().includes(term)) ||
        (item.branch && item.branch.toLowerCase().includes(term)) ||
        (item.grade && item.grade.toLowerCase().includes(term)) ||
        (item.pinsText && item.pinsText.toLowerCase().includes(term)) ||
        String(item.rowNumber).includes(term)
      );
    });
  }, [rows, searchTerm]);

  // Paginación local
  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredRows.slice(start, start + itemsPerPage);
  }, [filteredRows, currentPage]);

  const handleDownloadExcel = () => {
    const exportTarget = filteredRows.length > 0 ? filteredRows : rows;
    const exportName = `Pines_No_Coincidentes_${fileName.replace(/\.[^/.]+$/, "")}.xlsx`;
    excelService.exportUnmatchedPinsToExcel(exportTarget, exportName);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Estudiantes No Encontrados en Importación"
      icon={AlertTriangle}
      maxWidth="840px"
    >
      <div className="unmatched-modal-body">
        {/* Banner de resumen y estadísticas */}
        <div className="unmatched-summary-banner">
          <div className="unmatched-stat-card warning">
            <span className="unmatched-stat-num">{rows.length}</span>
            <span className="unmatched-stat-label">Filas no coincidentes</span>
          </div>

          <div className="unmatched-stat-card success">
            <span className="unmatched-stat-num">{totalAssigned}</span>
            <span className="unmatched-stat-label">Estudiantes asignados con éxito</span>
          </div>

          <div className="unmatched-stat-card neutral">
            <span className="unmatched-stat-filename" title={fileName}>
              {fileName}
            </span>
            <span className="unmatched-stat-label">Archivo procesado</span>
          </div>
        </div>

        {/* Explicación / Tip */}
        <div className="unmatched-tip-box">
          <Info size={18} className="unmatched-tip-icon" />
          <p>
            Estas filas contienen RUTs que no figuran en la lista de estudiantes. 
            Puedes <strong>descargar el archivo Excel</strong> para revisar si los RUTs 
            tienen errores tipográficos o registrar primero a los estudiantes en el sistema.
          </p>
        </div>

        {/* Barra de herramientas: Buscador y Botón de Descarga Excel */}
        <div className="unmatched-toolbar">
          <div className="unmatched-search-wrapper">
            <Search size={16} className="unmatched-search-icon" />
            <input
              type="text"
              placeholder="Buscar por RUT, nombre, sede o pin..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="unmatched-search-input"
            />
            {searchTerm && (
              <button 
                type="button" 
                onClick={() => setSearchTerm('')} 
                className="unmatched-clear-search"
                title="Limpiar búsqueda"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleDownloadExcel}
            className="unmatched-download-btn"
            title="Descargar listado en formato Excel"
          >
            <Download size={16} />
            <span>Descargar Excel ({filteredRows.length})</span>
          </button>
        </div>

        {/* Tabla interactiva de filas no coincidentes */}
        <div className="unmatched-table-container">
          {paginatedRows.length > 0 ? (
            <table className="unmatched-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Fila</th>
                  <th style={{ width: '130px' }}>RUT</th>
                  <th>Nombre</th>
                  <th>Sede / Carrera</th>
                  <th>Pin(es) en fila</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'center' }}>
                      <span className="unmatched-row-badge">
                        #{item.rowNumber}
                      </span>
                    </td>
                    <td>
                      <span className="unmatched-rut-code">
                        {item.formattedRut || item.rut}
                      </span>
                    </td>
                    <td>
                      {item.name ? (
                        <span className="unmatched-name">{item.name}</span>
                      ) : (
                        <span className="unmatched-muted">No especificado</span>
                      )}
                    </td>
                    <td>
                      <div className="unmatched-branch-cell">
                        {item.branch && <span className="unmatched-branch">{item.branch}</span>}
                        {item.grade && <span className="unmatched-grade">{item.grade}</span>}
                        {!item.branch && !item.grade && (
                          <span className="unmatched-muted">—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.pinsText ? (
                        <span className="unmatched-pins-text" title={item.pinsText}>
                          {item.pinsText}
                        </span>
                      ) : (
                        <span className="unmatched-muted">Sin pines reconocidos</span>
                      )}
                    </td>
                    <td>
                      <span className="unmatched-reason-badge">
                        {item.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="unmatched-empty-state">
              <p>No se encontraron resultados que coincidan con "{searchTerm}".</p>
            </div>
          )}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="unmatched-pagination">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="unmatched-page-btn"
            >
              Anterior
            </button>
            <span className="unmatched-page-info">
              Página {currentPage} de {totalPages} ({filteredRows.length} registros)
            </span>
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="unmatched-page-btn"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* Botones inferiores de cierre */}
        <div className="unmatched-footer-actions">
          <button
            type="button"
            className="unmatched-btn-secondary"
            onClick={onClose}
          >
            Cerrar
          </button>
          <button
            type="button"
            className="unmatched-btn-primary"
            onClick={handleDownloadExcel}
          >
            <Download size={16} />
            <span>Descargar Reporte Excel</span>
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default UnmatchedPinsModal;

