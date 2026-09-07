import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './StudentCard.css';

const StudentCard = ({ student }) => {
  const uncollectedAvailable = (student.availablePins || []).filter(
    pinId => !(student.collectedPins || []).includes(pinId)
  );
  const hasAvailable = uncollectedAvailable.length > 0;
  
  return (
    <div className={`student-card glass-panel animate-fade-in ${hasAvailable ? 'has-available-pins' : ''}`}>
      <div className="student-header">
        <img src={student.avatar} alt={student.name} className="student-avatar" />
        <div className="student-info">
          <h3 className="student-name">{student.name}</h3>
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
