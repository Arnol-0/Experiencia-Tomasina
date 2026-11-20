import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, UserCheck } from 'lucide-react';
import { useAppVersion } from '../context/AppVersionContext';
import './VersionBubble.css';

/**
 * ============================================================================
 * COMPONENTE: VersionBubble (Insignia Interactiva con Burbuja de Autoría)
 * ============================================================================
 *
 * Renderiza la insignia de versión actual de la app (local o publicada por admin).
 * Al hacer clic, muestra una burbuja con créditos y la versión activa.
 */
const VersionBubble = ({
  label,
  placement = 'bottom-start',
  className = ''
}) => {
  const { currentVersion } = useAppVersion();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const displayLabel = label || `v${currentVersion}`;

  // Cerrar al hacer clic fuera o al presionar la tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={`version-bubble-wrapper ${className}`} ref={containerRef}>
      <button
        type="button"
        className={`version-bubble-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label="Ver información de versión y creador"
        title="Clic para ver creador y versión"
      >
        <span className="version-pill-dot"></span>
        <span className="version-pill-text">{displayLabel}</span>
        <Sparkles size={13} className="version-pill-icon" />
      </button>

      {isOpen && (
        <div
          className={`version-bubble-popover placement-${placement} animate-bubble-in`}
          role="dialog"
          aria-label="Créditos y Versión"
        >
          <div className="bubble-arrow"></div>

          <button
            type="button"
            className="bubble-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar ventana"
          >
            <X size={14} />
          </button>

          <div className="bubble-header">
            <div className="bubble-avatar-wrapper">
              <Sparkles size={20} className="bubble-avatar-icon" />
            </div>
            <div className="bubble-title-group">
              <span className="bubble-app-name">Experiencia Tomasina</span>
              <span className="bubble-version-tag">Versión {currentVersion}</span>
            </div>
          </div>

          <div className="bubble-body">
            <span className="bubble-label">Creado por:</span>
            <h4 className="bubble-creator-name">Arnoldo Ortega Suarez</h4>
            <div className="bubble-badge-role">
              <UserCheck size={12} />
              <span>Autor de la Plataforma</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionBubble;

