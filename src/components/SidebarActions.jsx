import React, { useState } from 'react';
import { Users, Award, ShieldPlus, Trash2, UserPlus, Upload, Download, Settings, ChevronDown, Edit2, FileSpreadsheet } from 'lucide-react';
import { ROLES } from '../utils/permissions';
import TemplateDownloads from './TemplateDownloads';

/**
 * ============================================================================
 * COMPONENTE: SidebarActions (Panel Lateral de Acciones Administrativas)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. ISP (Interface Segregation Principle - Segregación de Interfaces):
 *    Segrega las acciones y vistas según el rol y nivel de privilegio del usuario:
 *    - Si es 'asistente_dae': No renderiza la barra (retorna null).
 *    - Si no es global (es de sede local): Oculta opciones globales como importar
 *      estudiantes o gestionar usuarios del sistema.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Su única función es actuar como centro de comandos y disparador de eventos
 *    (abrir modales, activar imports/exports), delegando la ejecución a las
 *    funciones controladoras del padre.
 */
const SidebarActions = ({ 
  user, 
  isGlobal, 
  onAddStudent, 
  onImportStudents, 
  onExportExcel, 
  onDeleteStudent, 
  onImportPins, 
  onExportPins,
  onCreateUser, 
  onManageUsers,
  onSearchEditStudent
}) => {
  const [openAccordion, setOpenAccordion] = useState('estudiantes');

  // Control de acceso por rol: Asistentes DAE no tienen acceso a acciones administrativas
  if (user?.role === ROLES.ASSISTANT) return null;


  return (
    <div className="admin-sidebar">
      <div className="student-management-section glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
        <div className="section-header">
          <Settings size={24} color="var(--color-primary)" />
          <h2>Panel de Acciones</h2>
        </div>
        <div className="management-actions" style={{ gap: 0 }}>
          
          <div className="accordion-item">
            <button 
              className={`accordion-header ${openAccordion === 'estudiantes' ? 'active' : ''}`}
              onClick={() => setOpenAccordion(openAccordion === 'estudiantes' ? '' : 'estudiantes')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Users size={18} />
                <span>Estudiantes</span>
              </div>
              <ChevronDown size={18} className="accordion-icon" />
            </button>
            <div className={`accordion-content ${openAccordion === 'estudiantes' ? 'open' : ''}`}>
              <button className="btn-outline btn-outline-green" onClick={onAddStudent}>
                <UserPlus size={18} /> Agregar Estudiante
              </button>
              {isGlobal && (
                <button className="btn-outline btn-outline-green" onClick={onImportStudents}>
                  <Upload size={18} /> Importar Estudiantes
                </button>
              )}
              <button className="btn-outline btn-outline-green" onClick={onSearchEditStudent}>
                <Edit2 size={18} /> Editar Estudiantes
              </button>
              <button className="btn-outline btn-outline-green" onClick={onExportExcel}>
                <Download size={18} /> Exportar Excel
              </button>
              <button className="btn-outline btn-outline-red" onClick={onDeleteStudent}>
                <Trash2 size={18} /> Eliminar Estudiante
              </button>
            </div>
          </div>

          {isGlobal && (
            <div className="accordion-item">
              <button 
                className={`accordion-header ${openAccordion === 'pines' ? 'active' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'pines' ? '' : 'pines')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Award size={18} />
                  <span>Gestión de Pines</span>
                </div>
                <ChevronDown size={18} className="accordion-icon" />
              </button>
              <div className={`accordion-content ${openAccordion === 'pines' ? 'open' : ''}`}>
                <label className="btn-outline btn-outline-green" style={{ cursor: 'pointer' }}>
                  <Upload size={18} /> Importar Pines
                  <input type="file" accept=".xlsx, .xls, .csv" onChange={onImportPins} style={{ display: 'none' }} />
                </label>
                {onExportPins && (
                  <button className="btn-outline btn-outline-green" onClick={onExportPins}>
                    <Download size={18} /> Exportar Pines (Horizontal)
                  </button>
                )}
              </div>
            </div>
          )}

          {isGlobal && (
            <div className="accordion-item">
              <button 
                className={`accordion-header ${openAccordion === 'sistema' ? 'active' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'sistema' ? '' : 'sistema')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Settings size={18} />
                  <span>Sistema y Usuarios</span>
                </div>
                <ChevronDown size={18} className="accordion-icon" />
              </button>
              <div className={`accordion-content ${openAccordion === 'sistema' ? 'open' : ''}`}>
                <button className="btn-outline btn-outline-green" onClick={onCreateUser}>
                  <ShieldPlus size={18} /> Crear Nuevo Usuario
                </button>
                <button className="btn-outline btn-outline-green" onClick={onManageUsers}>
                  <Users size={18} /> Gestionar Usuarios
                </button>
              </div>
            </div>
          )}

          {/* 📌 Plantillas Excel: descarga directa de los archivos servidos desde public/plantillas */}
          {isGlobal && (
            <div className="accordion-item">
              <button 
                className={`accordion-header ${openAccordion === 'plantillas' ? 'active' : ''}`}
                onClick={() => setOpenAccordion(openAccordion === 'plantillas' ? '' : 'plantillas')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <FileSpreadsheet size={18} />
                  <span>Plantillas Excel</span>
                </div>
                <ChevronDown size={18} className="accordion-icon" />
              </button>
              <div className={`accordion-content ${openAccordion === 'plantillas' ? 'open' : ''}`}>
                <TemplateDownloads />
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SidebarActions;
