import React, { useState } from 'react';
import { Users, Award, ShieldPlus, Trash2, UserPlus, Upload, Download, Settings, ChevronDown, Edit2 } from 'lucide-react';

const SidebarActions = ({ 
  user, 
  isGlobal, 
  onAddStudent, 
  onImportStudents, 
  onExportExcel, 
  onDeleteStudent, 
  onImportPins, 
  onCreateUser, 
  onManageUsers,
  onSearchEditStudent
}) => {
  const [openAccordion, setOpenAccordion] = useState('estudiantes');

  if (user?.role === 'asistente_dae') return null;

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

        </div>
      </div>
    </div>
  );
};

export default SidebarActions;
