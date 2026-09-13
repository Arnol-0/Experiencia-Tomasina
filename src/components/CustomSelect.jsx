import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, placeholder = "Seleccionar..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

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

  const getDisplayLabel = () => {
    if (!value) return placeholder;
    for (const item of options) {
      if (item.options) {
        const found = item.options.find(opt => (typeof opt === 'object' ? opt.value === value : opt === value));
        if (found) return typeof found === 'object' ? found.label : found;
      } else {
        const optValue = typeof item === 'object' ? item.value : item;
        if (optValue === value) return typeof item === 'object' ? item.label : item;
      }
    }
    return value;
  };

  return (
    <div className="custom-select-container" ref={containerRef}>
      <div 
        className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setSearchTerm('');
            setTimeout(() => inputRef.current?.focus(), 100);
          }
        }}
      >
        <span>{getDisplayLabel()}</span>
        <ChevronDown size={18} className="custom-select-icon" />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown animate-fade-in">
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
          {options.map((item, index) => {
            if (item.options) {
              const filteredOpts = item.options.filter(opt => {
                const optLabel = typeof opt === 'object' ? opt.label : opt;
                return optLabel.toLowerCase().includes(searchTerm.toLowerCase());
              });
              if (filteredOpts.length === 0) return null;
              
              return (
                <div key={index} className="custom-select-group">
                  {item.label && <div className="custom-select-group-label">{item.label}</div>}
                  {filteredOpts.map((opt, optIndex) => {
                    const optValue = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <div 
                        key={optIndex}
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
                  })}
                </div>
              );
            } else {
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
