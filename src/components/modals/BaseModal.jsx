import React from 'react';
import { X } from 'lucide-react';
import '../../pages/Dashboard.css';

/**
 * ============================================================================
 * COMPONENTE BASE: BaseModal (Cascarón Reutilizable de Modales)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. OCP (Open/Closed Principle - Abierto para Extensión / Cerrado para Modificación):
 *    BaseModal está CERRADO para modificación: no necesitamos cambiar este archivo
 *    cada vez que queramos una nueva ventana emergente (como crear usuario, editar alumno, etc.).
 *    Está ABIERTO para extensión: recibe `{ children }` y propiedades como `maxWidth`,
 *    `title` e `icon`, permitiendo crear cualquier modal imaginado simplemente envolviéndolo aquí.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Su única responsabilidad es controlar la apariencia y comportamiento base del modal:
 *    - Fondo oscuro semitransparente (overlay)
 *    - Botón de cierre superior (la "X")
 *    - Centrado y animación de entrada
 *    No sabe NADA sobre formularios de usuarios ni de estudiantes.
 * 
 * 3. LSP (Liskov Substitution Principle - Sustitución de Liskov):
 *    Establece un contrato predecible (`isOpen`, `onClose`, `children`). Cualquier modal
 *    que se base en este cascarón se comporta de manera uniforme y confiable en la aplicación.
 */
const BaseModal = ({ isOpen, onClose, title, icon: Icon, children, maxWidth = '500px' }) => {
  // Si el modal no está abierto, no renderiza nada en el DOM (ahorra memoria y rendimiento)
  if (!isOpen) return null;

  return (
    <div className="dashboard-modal-overlay">
      <div className="dashboard-modal-content animate-fade-in" style={{ maxWidth }}>
        {/* Botón estándar para cerrar el modal */}
        <button className="dashboard-modal-close" onClick={onClose} aria-label="Cerrar ventana">
          <X size={24} />
        </button>
        
        {/* Cabecera opcional con icono y título */}
        {(title || Icon) && (
          <div className="section-header">
            {Icon && <Icon size={24} color="var(--color-primary)" />}
            {title && <h2>{title}</h2>}
          </div>
        )}
        
        {/* Inyección del contenido dinámico (Principio Open/Closed) */}
        {children}
      </div>
    </div>
  );
};

export default BaseModal;

