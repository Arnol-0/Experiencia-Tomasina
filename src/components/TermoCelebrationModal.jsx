import React from 'react';
import { X, Gift, Trophy, CheckCircle, Sparkles } from 'lucide-react';
import termoImg from '../assets/termo.png';
import './TermoCelebrationModal.css';

/**
 * ============================================================================
 * COMPONENTE: TermoCelebrationModal (Notificación Central de Logro de 7 Pines)
 * ============================================================================
 * 
 * 📌 RESPONSABILIDAD:
 * Modal centrado en pantalla con animación festiva que anuncia cuando el alumno
 * alcanza la meta del 7mo pin, permitiendo realizar el desbloqueo y entrega.
 * Utiliza estrictamente la paleta de colores institucional Santo Tomás.
 */
const TermoCelebrationModal = ({
  isOpen = false,
  onClose,
  studentName = '',
  isDelivered = false,
  isProcessing = false,
  onUnlock
}) => {
  if (!isOpen) return null;

  return (
    <div className="celebration-overlay" onClick={(e) => {
      if (e.target.classList.contains('celebration-overlay')) onClose();
    }}>
      {/* Partículas de confeti sutiles flotantes */}
      <div className="celebration-particles" aria-hidden="true">
        <span className="particle p1"></span>
        <span className="particle p2"></span>
        <span className="particle p3"></span>
        <span className="particle p4"></span>
        <span className="particle p5"></span>
        <span className="particle p6"></span>
        <span className="particle p7"></span>
        <span className="particle p8"></span>
      </div>

      <div className="celebration-card glass-panel animate-scale-up">
        {/* Botón cerrar */}
        <button 
          type="button" 
          className="celebration-close-btn" 
          onClick={onClose}
          aria-label="Cerrar notificación"
        >
          <X size={22} />
        </button>

        {/* Insignia superior */}
        <div className="celebration-top-badge">
          <Trophy size={16} className="celebration-badge-icon" />
          <span>Meta Alcanzada • 7 Pines</span>
        </div>

        {/* Ilustración central del termo con halo institucional */}
        <div className="celebration-termo-container">
          <div className="celebration-termo-halo"></div>
          <img 
            src={termoImg} 
            alt="Termo Tomasino" 
            className="celebration-termo-img animate-float-termo" 
          />
          <div className="celebration-sparkle-tag">
            <Sparkles size={16} />
            <span>Oficial ST</span>
          </div>
        </div>

        {/* Mensaje de felicitación */}
        <h2 className="celebration-title text-gradient">¡Felicidades!</h2>
        
        <p className="celebration-student">
          {studentName ? `${studentName} ha completado` : 'Se ha completado'} con éxito la meta del <strong>séptimo pin</strong>.
        </p>

        <p className="celebration-desc">
          Ya se encuentra disponible para obtener y entregar el <strong>Termo Institucional Santo Tomás</strong>.
        </p>

        {/* Acciones */}
        <div className="celebration-actions">
          {!isDelivered ? (
            <>
              <button
                type="button"
                className={`celebration-btn-primary ${isProcessing ? 'loading' : ''}`}
                onClick={onUnlock}
                disabled={isProcessing}
              >
                <Gift size={20} />
                <span>{isProcessing ? 'Registrando entrega...' : 'Desbloquear Termo Ahora'}</span>
              </button>
              <button
                type="button"
                className="celebration-btn-secondary"
                onClick={onClose}
              >
                Ver más tarde
              </button>
            </>
          ) : (
            <div className="celebration-already-delivered">
              <div className="celebration-success-pill">
                <CheckCircle size={18} />
                <span>Termo desbloqueado y registrado</span>
              </div>
              <button
                type="button"
                className="celebration-btn-secondary"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermoCelebrationModal;
