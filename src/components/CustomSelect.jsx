import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import './CustomSelect.css';

/**
 * ============================================================================
 * COMPONENTE: CustomSelect (Selector Desplegable Personalizado y Accesible)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. OCP (Open/Closed Principle - Abierto para Extensión / Cerrado para Modificación):
 *    Es un componente altamente polimórfico y reutilizable. Admite listas simples,
 *    arreglos de objetos `{ value, label }` o grupos categorizados con `{ label, options }`.
 *    Se adapta a cualquier caso de uso en la app sin requerir modificaciones en su código.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Se encarga exclusivamente de la experiencia de selección: abrir/cerrar,
 *    buscar opciones dinámicamente con filtro en tiempo real y cerrar al hacer clic afuera.
 */
const CustomSelect = ({ value, onChange, options, placeholder = "Seleccionar..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Detecta clics fuera del componente para cerrar el menú desplegable automáticamente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  /**
   * Obtiene la etiqueta de texto (label) que debe mostrarse en el botón según el valor seleccionado.
   * Maneja tanto opciones simples como opciones anidadas en grupos.
   */
  const getDisplayLabel = () => {
    if (!value) return placeholder; // Si no hay valor seleccionado, muestra el placeholder (ej: "Seleccionar Sede")
    
    for (const item of options) {
      // Caso 1: Opciones agrupadas por categoría (ej: "Zona Norte", "Zona Centro")
      if (item.options) {
        const found = item.options.find(opt => (typeof opt === 'object' ? opt.value === value : opt === value));
        if (found) return typeof found === 'object' ? found.label : found;
      } else {
        // Caso 2: Lista plana de opciones
        const optValue = typeof item === 'object' ? item.value : item;
        if (optValue === value) return typeof item === 'object' ? item.label : item;
      }
    }
    return value;
  };

  return (
    // Contenedor principal con referencia (ref) para detectar clics exteriores
    <div className="custom-select-container" ref={containerRef}>
      
      {/* BOTÓN DISPARADOR: Muestra la opción actual y la flecha hacia abajo */}
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearchTerm('');
            // Hace foco automático en el input de búsqueda al abrir
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        <span>{getDisplayLabel()}</span>
        <ChevronDown size={18} className="custom-select-icon" />
      </div>

      {/* MENÚ DESPLEGABLE (DROPDOWN) */}
      {isOpen && (
        <div className="custom-select-dropdown animate-fade-in">
          
          {/* BARRA DE BÚSQUEDA INTERNA: Se activa si la lista tiene más de 5 opciones (ej: las 22 sedes de Santo Tomás) */}
          {options.length > 5 && (
            <div className="custom-select-search-container" style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 0, background: 'var(--color-surface)', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                <Search size={14} color="var(--text-muted)" style={{ marginRight: '0.5rem' }} />
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Buscar..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.9rem', padding: '0.25rem' }}
                />
              </div>
            </div>
          )}

          {/* RENDERIZADO DE LAS OPCIONES FILTRADAS */}
          {options.map((item, index) => {
            // SI LAS OPCIONES ESTÁN AGRUPADAS (ej: Zona Norte, Zona Centro)
            if (item.options) {
              const filteredOpts = item.options.filter(opt => {
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return optLabel.toLowerCase().includes(searchTerm.toLowerCase());
              });
              if (filteredOpts.length === 0) return null;
              
              return (
                <div key={index} className="custom-select-group">
                  {/* Título de la categoría del grupo */}
                  {item.label && <div className="custom-select-group-label">{item.label}</div>}
                  
                  {/* Cada opción dentro del grupo */}
                  {filteredOpts.map((opt, optIndex) => {
                    const optValue = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <div 
                        key={optIndex}
                        className={`custom-select-option ${value === optValue ? 'selected' : ''}`}
                        onClick={() => {
                          onChange(optValue); // Comunica el cambio al componente padre
                          setIsOpen(false);   // Cierra el menú
                          setSearchTerm('');  // Limpia la búsqueda
                        }}
                      >
                        <span>{optLabel}</span>
                        {/* Muestra un check si es la opción actualmente seleccionada */}
                        {value === optValue && <Check size={16} className="check-icon" />}
                      </div>
                    );
                  })}
                </div>
              );
            } else {
              // SI ES UNA LISTA PLANA DE OPCIONES
              const optValue = typeof item === 'object' ? item.value : item;
              const optLabel = typeof item === 'object' ? item.label : item;
              if (searchTerm && !optLabel.toLowerCase().includes(searchTerm.toLowerCase())) return null;

              return (
                <div 
                  key={index}
                  className={`custom-select-option ${value === optValue ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span>{optLabel}</span>
                  {value === optValue && <Check size={16} className="check-icon" />}
                </div>
              );
            }
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
