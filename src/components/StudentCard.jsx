import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Edit2 } from 'lucide-react';
import './StudentCard.css';

const StudentCard = ({ student, onEdit }) => {
  const uncollectedAvailable = (student.availablePins || []).filter(
    pinId => !(student.collectedPins || []).includes(pinId)
  );
  const hasAvailable = uncollectedAvailable.length > 0;
  
  return (
    <div className={`student-card glass-panel animate-fade-in ${hasAvailable ? 'has-available-pins' : ''}`}>
      <div className="student-header">
        <img src={student.avatar} alt={student.name} className="student-avatar" />
        <div className="student-info">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className="student-name" style={{ margin: 0 }}>{student.name}</h3>
            {onEdit && (
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(student); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                title="Editar Estudiante"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
          {(student.rut || student.id) && !String(student.id).startsWith('imported') && (
            <span className="student-rut" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>
              RUT: {student.rut || student.id}
            </span>
          )}
          <span className="student-grade">{student.grade}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {student.jornada && <span><strong>Jornada:</strong> {student.jornada}</span>}
            {student.branch && <span><strong>Institución:</strong> {student.branch}</span>}
          </div>
        </div>
      </div>
      
      <p className="student-bio">{student.bio}</p>
      
      <div className="student-stats">
        <div className="stat">
          <span className="stat-value text-gradient">{(student.collectedPins || []).length}</span>
          <span className="stat-label">Obtenidos</span>
        </div>
        {hasAvailable && (
          <div className="stat" style={{ marginLeft: '1.5rem' }}>
            <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{uncollectedAvailable.length}</span>
            <span className="stat-label" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Disponibles</span>
          </div>
        )}
      </div>

      <Link to={`/student/${student.id}`} className="student-action">
        Ver Recorrido <ChevronRight size={18} />
      </Link>
    </div>
  );
};

export default StudentCard;
