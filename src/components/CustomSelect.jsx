import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import './CustomSelect.css';

const CustomSelect = ({ value, onChange, options, placeholder = "Seleccionar..." }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
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
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getDisplayLabel()}</span>
        <ChevronDown size={18} className="custom-select-icon" />
      </div>

      {isOpen && (
        <div className="custom-select-dropdown animate-fade-in">
          {options.map((item, index) => {
            if (item.options) {
              return (
                <div key={index} className="custom-select-group">
                  {item.label && <div className="custom-select-group-label">{item.label}</div>}
                  {item.options.map((opt, optIndex) => {
                    const optValue = typeof opt === 'object' ? opt.value : opt;
                    const optLabel = typeof opt === 'object' ? opt.label : opt;
                    return (
                      <div 
                        key={optIndex}
                        className={`custom-select-option ${value === optValue ? 'selected' : ''}`}
                        onClick={() => {
                          onChange(optValue);
                          setIsOpen(false);
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
              return (
                <div 
                  key={index}
                  className={`custom-select-option ${value === optValue ? 'selected' : ''}`}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
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
