import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { useAppVersion } from '../context/AppVersionContext';
import './VersionNotice.css';

/**
 * ============================================================================
 * COMPONENTE: VersionNotice (Notificación de Nueva Versión)
 * ============================================================================
 *
 * Muestra una notificación con la versión y notas de parche publicadas.
 * La fuente puede ser local (fallback) o remota (publicada por admin en Firestore).
 *
 * Lógica de visibilidad:
 * - Se identifica la publicación por versión + marca de publicación (releaseKey).
 * - Si es una publicación nueva, se registra primera visualización y se muestra.
 * - Se muestra durante la ventana configurada desde la primera visualización.
 * - Si el usuario la cierra manualmente, no se vuelve a mostrar para esa publicación.
 */
const STORAGE_KEY = 'tuViajeST_versionNotice';

const VersionNotice = () => {
  const { currentVersion, currentRelease, noticeDurationMs } = useAppVersion();
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  const releaseKey = `${currentVersion}::${currentRelease?.publishedAt || 'local'}`;

  useEffect(() => {
    if (!currentVersion) {
      setVisible(false);
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : null;

      // Compatibilidad con formato anterior (solo version)
      const storedKey = data?.releaseKey || (data?.version ? `${data.version}::local` : null);

      // Si ya fue cerrada manualmente para esta publicación → no mostrar
      if (storedKey === releaseKey && data?.dismissed) {
        setVisible(false);
        return;
      }

      // Publicación nueva o primera visita para esta publicación
      if (storedKey !== releaseKey) {
        const record = {
          version: currentVersion,
          releaseKey,
          firstSeen: Date.now(),
          dismissed: false
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setAnimateOut(false);
        setVisible(true);
        return;
      }

      // Misma publicación: mostrar si sigue dentro de la ventana
      const elapsed = Date.now() - (data?.firstSeen || 0);
      if (elapsed < noticeDurationMs) {
        setAnimateOut(false);
        setVisible(true);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, releaseKey, dismissed: true }));
        setVisible(false);
      }
    } catch {
      // Si localStorage falla, no mostrar nada
      setVisible(false);
    }
  }, [currentVersion, releaseKey, noticeDurationMs]);

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setVisible(false);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...data, version: currentVersion, releaseKey, dismissed: true })
        );
      } catch {
        // noop
      }
    }, 400);
  };

  if (!visible || !currentRelease) return null;

  const changes = Array.isArray(currentRelease.changes) ? currentRelease.changes : [];
  if (changes.length === 0) return null;

  return (
    <div
      className="version-notice-overlay"
      onClick={(e) => {
        if (e.target.classList.contains('version-notice-overlay')) handleDismiss();
      }}
    >
      <div className={`version-notice-modal ${animateOut ? 'animate-out' : 'animate-in'}`}>
        <button
          type="button"
          className="version-notice-close"
          onClick={handleDismiss}
          aria-label="Cerrar notificación"
        >
          <X size={20} />
        </button>

        <div className="version-notice-header">
          <div className="version-badge-glow">
            <Sparkles size={22} className="version-sparkle-icon" />
            <span className="version-badge-text">v{currentVersion}</span>
          </div>
          <h2 className="version-notice-title">¡Nueva Actualización!</h2>
          <p className="version-notice-subtitle">{currentRelease.title || 'Actualización disponible'}</p>
          {currentRelease.date && <span className="version-notice-date">{currentRelease.date}</span>}
        </div>

        <div className="version-notice-changes">
          {changes.map((change, index) => (
            <div
              key={`${releaseKey}-${index}`}
              className="version-change-item"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <span className="version-change-icon">{change.icon || '✨'}</span>
              <p className="version-change-text">{change.text}</p>
            </div>
          ))}
        </div>

        <button type="button" className="version-notice-cta" onClick={handleDismiss}>
          <span>Entendido, ¡vamos!</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default VersionNotice;
