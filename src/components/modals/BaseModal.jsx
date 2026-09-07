import React from 'react';
import { X } from 'lucide-react';
import '../../pages/Dashboard.css';

/**
 * BaseModal enforces LSP and SRP by providing the boilerplate
 * modal overlay, content sizing, animation, and close buttons.
 */
const BaseModal = ({ isOpen, onClose, title, icon: Icon, children, maxWidth = '500px' }) => {
  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content animate-fade-in" style={{ maxWidth }}>
        <button className="dashboard-modal-close" onClick={onClose}>
          <X size={24} />
        </button>
        
        {(title || Icon) && (
          <div className="section-header">
            {Icon && <Icon size={24} color="var(--color-primary)" />}
            {title && <h2>{title}</h2>}
          </div>
        )}
        
        {children}
      </div>
    </div>
  );
};

export default BaseModal;
