import React from 'react';
import { Database, Zap, Building2, ShieldCheck } from 'lucide-react';
import './SedeLoadingAnimation.css';

/**
 * ============================================================================
 * COMPONENTE: SedeLoadingAnimation
 * ============================================================================
 * 
 * Animación moderna de alto impacto visual para la carga de estudiantes
 * de cada sede de Santo Tomás.
 * 
 * Incluye:
 * - Radar / Órbita pulsante en tonos verdes institucionales y acentos dorados
 * - Indicador dinámico de la sede que se está sincronizando
 * - Chips de estado en tiempo real (Caché local ultrarrápida / Nube Firestore)
 * - Grilla de tarjetas Skeleton con efecto Shimmer para percepción de carga instantánea
 */
export const SedeLoadingAnimation = ({ 
  sedeName = 'Todas las Sedes', 
  message = 'Sincronizando base de datos en tiempo real...',
  showSkeletons = true,
  count = 6
}) => {
  return (
    <div className="sede-loading-container animate-fade-in">
      {/* Banner Principal de Carga con Radar Holográfico */}
      <div className="sede-loading-hero glass-panel">
        <div className="sede-radar-wrapper">
          <div className="radar-pulse radar-pulse-1" />
          <div className="radar-pulse radar-pulse-2" />
          <div className="radar-pulse radar-pulse-3" />
          <div className="radar-core">
            <Database className="radar-icon" size={28} />
          </div>
          <div className="orbiting-dot" />
        </div>

        <div className="sede-loading-info">
          <div className="sede-badge-row">
            <span className="sede-live-pill">
              <span className="live-dot" /> EN TIEMPO REAL
            </span>
            <span className="sede-name-pill">
              <Building2 size={13} /> {sedeName}
            </span>
          </div>

          <h3 className="sede-loading-title">
            Cargando Estudiantes de <span className="text-gradient">{sedeName}</span>
          </h3>

          <p className="sede-loading-subtitle">{message}</p>

          <div className="sede-speed-bar-wrapper">
            <div className="sede-speed-bar">
              <div className="sede-speed-fill" />
            </div>
            <div className="sede-speed-meta">
              <span className="speed-tag">
                <Zap size={12} className="speed-icon" /> Caché Local Activa (IndexedDB)
              </span>
              <span className="speed-tag">
                <ShieldCheck size={12} className="speed-icon" /> Sincronización Segura
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grilla de Skeleton Cards para previsualización instantánea */}
      {showSkeletons && (
        <div className="sede-skeletons-grid">
          {Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="skeleton-card glass-panel" style={{ animationDelay: `${idx * 0.08}s` }}>
              <div className="skeleton-header">
                <div className="skeleton-avatar shimmer" />
                <div className="skeleton-badge shimmer" />
              </div>

              <div className="skeleton-body">
                <div className="skeleton-line skeleton-title shimmer" />
                <div className="skeleton-line skeleton-subtitle shimmer" />
                <div className="skeleton-meta-row">
                  <div className="skeleton-pill shimmer" />
                  <div className="skeleton-pill shimmer" />
                </div>
              </div>

              <div className="skeleton-footer">
                <div className="skeleton-pins-row">
                  {Array.from({ length: 4 }).map((__, pIdx) => (
                    <div key={pIdx} className="skeleton-pin-slot shimmer" />
                  ))}
                </div>
                <div className="skeleton-button shimmer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SedeLoadingAnimation;
