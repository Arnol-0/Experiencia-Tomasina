import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, UserCheck } from 'lucide-react';
import './VersionBubble.css';

/**
 * ============================================================================
 * COMPONENTE: VersionBubble (Insignia Interactiva con Burbuja de Autoría)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE ESTE COMPONENTE?
 * Renderiza la insignia interactiva "v1.0" o "Versión 1.0".
 * Al hacer clic, abre un modal estilo burbuja (popover) con efecto vidrio,
 * flecha apuntadora y animación suave indicando la autoría de la plataforma.
 *
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Single Responsibility Principle):
 *    Solo se encarga del renderizado de la versión y la presentación de la burbuja
 *    de autoría, abstrayendo eventos de clic exterior y teclado.
 * 2. OCP (Open/Closed Principle):
 *    Permite parametrizar el texto (`label`) y la alineación (`placement`).
 */
const VersionBubble = ({
  label = 'v1.0',
  placement = 'bottom-start',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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
      {/* Botón interactivo de versión */}
      <button
        type="button"
        className={`version-bubble-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-expanded={isOpen}
        aria-label="Ver información de versión y creador"
        title="Clic para ver creador y versión"
      >
        <span className="version-pill-dot"></span>
        <span className="version-pill-text">{label}</span>
        <Sparkles size={13} className="version-pill-icon" />
      </button>

      {/* Burbuja flotante informativa */}
      {isOpen && (
        <div
          className={`version-bubble-popover placement-${placement} animate-bubble-in`}
          role="dialog"
          aria-label="Créditos y Versión"
        >
          {/* Flecha indicadora de la burbuja */}
          <div className="bubble-arrow"></div>

          {/* Botón de cierre */}
          <button
            type="button"
            className="bubble-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Cerrar ventana"
          >
            <X size={14} />
          </button>

          {/* Cabecera / Identidad */}
          <div className="bubble-header">
            <div className="bubble-avatar-wrapper">
              <Sparkles size={20} className="bubble-avatar-icon" />
            </div>
            <div className="bubble-title-group">
              <span className="bubble-app-name">Experiencia Tomasina</span>
              <span className="bubble-version-tag">Versión 1.0</span>
            </div>
          </div>

          {/* Cuerpo con créditos del creador */}
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

