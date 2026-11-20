import React from 'react';
import { Gift, Sparkles, CheckCircle, Lock, Trophy, AlertCircle, RotateCcw } from 'lucide-react';
import termoImg from '../assets/termo.png';
import './TermoTracker.css';

/**
 * ============================================================================
 * COMPONENTE: TermoTracker (Barra y Silueta de Progreso del Termo Tomasino)
 * ============================================================================
 * 
 * 📌 RESPONSABILIDAD:
 * Muestra el termo oficial en el panel lateral derecho con su silueta en sombra.
 * Conforme el estudiante colecciona pines, el termo se llena progresivamente
 * hasta alcanzar la meta de 7 pines.
 * 
 * Al llegar a 7 pines:
 * - Emite la alerta visual ("alarmita bonita") de recompensa desbloqueable.
 * - Permite al personal autorizado desbloquear y registrar la entrega del termo.
 * - Para admin y coordinador, permite revertir/bloquear en caso de error.
 */
const TermoTracker = ({
  collectedCount = 0,
  targetCount = 7,
  isDelivered = false,
  deliveredRecord = null,
  canUnlock = false,
  canManage = false,
  isProcessing = false,
  onUnlock,
  onRevoke
}) => {
  // Porcentaje de llenado (de 0 a 100%, con base en 7 pines)
  const rawPercentage = (collectedCount / targetCount) * 100;
  const fillPercentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));
  const isGoalReached = collectedCount >= targetCount;
  const pinsRemaining = Math.max(0, targetCount - collectedCount);

  return (
    <div className={`termo-tracker-card glass-panel ${isGoalReached ? 'goal-reached' : ''} ${isDelivered ? 'is-delivered' : ''}`}>
      {/* CABECERA */}
      <div className="termo-card-header">
        <div className="termo-header-badge">
          <Trophy size={18} className="termo-trophy-icon" />
          <span>Recompensa Oficial</span>
        </div>
        <span className="termo-target-pill">Meta: {targetCount} Pines</span>
      </div>

      <h3 className="termo-title">Termo Tomasino</h3>
      <p className="termo-subtitle">
        Incentivo por participación activa en el viaje formativo.
      </p>

      {/* ÁREA VISUAL DEL TERMO (SILUETA + RELLENO LÍQUIDO) */}
      <div className="termo-visual-wrapper">
        <div className="termo-stage">
          {/* Capa 1: Sombra / Silueta en baja opacidad */}
          <img 
            src={termoImg} 
            alt="Silueta de Termo" 
            className="termo-img termo-silhouette" 
          />

          {/* Capa 2: Termo a todo color recortado según porcentaje (de abajo hacia arriba) */}
          <div 
            className="termo-fill-layer"
            style={{
              clipPath: `inset(${100 - fillPercentage}% 0 0 0)`
            }}
          >
            <img 
              src={termoImg} 
              alt="Termo con Carga" 
              className="termo-img termo-filled" 
            />
            {/* Línea de brillo en el nivel del líquido cuando se está llenando */}
            {fillPercentage > 3 && fillPercentage < 100 && (
              <div 
                className="termo-fill-glow-line"
                style={{ bottom: `${fillPercentage}%` }}
              />
            )}
          </div>

          {/* Halo festivo cuando ya alcanzó los 7 pines o ya fue entregado */}
          {(isGoalReached || isDelivered) && (
            <div className="termo-aura-celebration" />
          )}

          {/* Píldora de porcentaje flotante */}
          <div className={`termo-percent-tag ${isGoalReached ? 'completed' : ''}`}>
            {fillPercentage}%
          </div>
        </div>
      </div>

      {/* INDICADOR DE PASOS (7 PUNTOS DE AVANCE) */}
      <div className="termo-steps-container">
        <div className="termo-steps-label">
          <span>Progreso: <strong>{collectedCount} de {targetCount}</strong> pines</span>
          <span>{isGoalReached ? '¡Completado!' : `Faltan ${pinsRemaining}`}</span>
        </div>

        <div className="termo-steps-track">
          {Array.from({ length: targetCount }).map((_, idx) => {
            const stepNumber = idx + 1;
            const isFilled = stepNumber <= collectedCount;
            return (
              <div 
                key={stepNumber}
                className={`termo-step-dot ${isFilled ? 'filled' : ''} ${stepNumber === targetCount ? 'final-step' : ''}`}
                title={`Pin ${stepNumber}${isFilled ? ' (Obtenido)' : ''}`}
              >
                {isFilled ? '✓' : stepNumber}
              </div>
            );
          })}
        </div>
      </div>

      {/* ESTADO 1: AÚN NO LLEGA A 7 PINES */}
      {!isGoalReached && !isDelivered && (
        <div className="termo-status-box in-progress">
          <p className="termo-status-text">
            Al acumular <strong>{pinsRemaining} {pinsRemaining === 1 ? 'pin más' : 'pines más'}</strong>, se activará la opción para entregar el termo al estudiante.
          </p>
        </div>
      )}

      {/* ESTADO 2: LLEGÓ A 7 PINES Y ESTÁ PENDIENTE DE DESBLOQUEO */}
      {isGoalReached && !isDelivered && (
        <div className="termo-alarm-box">
          <div className="termo-alarm-top">
            <Sparkles className="termo-alarm-sparkle" size={24} />
            <div>
              <h4 className="termo-alarm-title">¡Meta de 7 Pines Alcanzada! 🎉</h4>
              <p className="termo-alarm-desc">
                El estudiante completó la meta requerida para obtener su Termo Oficial.
              </p>
            </div>
          </div>

          {canUnlock ? (
            <button
              type="button"
              className={`termo-unlock-action-btn ${isProcessing ? 'loading' : ''}`}
              onClick={onUnlock}
              disabled={isProcessing}
            >
              <Gift size={18} />
              <span>{isProcessing ? 'Registrando entrega...' : 'Ver y Desbloquear Termo'}</span>
            </button>
          ) : (
            <div className="termo-no-perms-notice">
              <AlertCircle size={16} />
              <span>Esperando que un directivo o coordinador confirme la entrega.</span>
            </div>
          )}
        </div>
      )}

      {/* ESTADO 3: YA FUE ENTREGADO */}
      {isDelivered && (
        <div className="termo-delivered-box">
          <div className="termo-delivered-badge">
            <CheckCircle size={22} className="delivered-check-icon" />
            <div>
              <h4 className="delivered-title">¡Termo Entregado con Éxito!</h4>
              {deliveredRecord?.deliveredAt && (
                <p className="delivered-date">
                  Entregado el {new Date(deliveredRecord.deliveredAt).toLocaleDateString('es-CL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                  {deliveredRecord.deliveredBy ? ` por ${deliveredRecord.deliveredBy}` : ''}
                </p>
              )}
            </div>
          </div>

          {/* Opción administrativa para coordinadores y administradores */}
          {canManage && typeof onRevoke === 'function' && (
            <button
              type="button"
              className="termo-revoke-btn"
              onClick={onRevoke}
              disabled={isProcessing}
              title="Permite al admin/coordinador revertir el estado del termo si fue entregado por equivocación"
            >
              <RotateCcw size={14} />
              <span>Revertir entrega (Admin)</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TermoTracker;
