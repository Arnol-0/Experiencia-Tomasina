import React, { useState, useEffect } from 'react';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import { APP_VERSION, VERSION_NOTICE_DURATION_MS, CHANGELOG } from '../constants/appVersion';
import './VersionNotice.css';

/**
 * ============================================================================
 * COMPONENTE: VersionNotice (Notificación de Nueva Versión)
 * ============================================================================
 *
 * 📌 ¿QUÉ HACE?
 * Muestra una ventana modal elegante al entrar a la app indicando que se
 * actualizó a una nueva versión, con la lista de cambios realizados.
 *
 * 📌 LÓGICA DE VISIBILIDAD (2 horas):
 * - Al cargar, revisa en localStorage si ya se registró esta versión.
 * - Si es la primera vez, guarda un timestamp y muestra la notificación.
 * - Si ya pasó el timestamp pero no han pasado 2 horas, la sigue mostrando.
 * - Después de 2 horas desde el primer registro, ya no se muestra más.
 * - Si el usuario cierra la ventana manualmente, tampoco se muestra de nuevo.
 */
const STORAGE_KEY = 'tuViajeST_versionNotice';

const VersionNotice = () => {
  const [visible, setVisible] = useState(false);
  const [animateOut, setAnimateOut] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : null;

      // Si ya fue cerrada manualmente para esta versión → no mostrar
      if (data && data.version === APP_VERSION && data.dismissed) {
        return;
      }

      // Si es una versión nueva o primera visita, registrar timestamp
      if (!data || data.version !== APP_VERSION) {
        const record = {
          version: APP_VERSION,
          firstSeen: Date.now(),
          dismissed: false
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
        setVisible(true);
        return;
      }

      // Si ya fue vista pero no cerrada y no han pasado 2 horas → mostrar
      const elapsed = Date.now() - data.firstSeen;
      if (elapsed < VERSION_NOTICE_DURATION_MS) {
        setVisible(true);
      } else {
        // Ya pasaron 2 horas: marcar como dismissed
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, dismissed: true }));
      }
    } catch {
      // Si localStorage falla, no mostrar nada
    }
  }, []);

  const handleDismiss = () => {
    setAnimateOut(true);
    setTimeout(() => {
      setVisible(false);
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : {};
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, dismissed: true }));
      } catch { }
    }, 400);
  };

  if (!visible) return null;

  // Buscar el changelog de la versión actual
  const currentChangelog = CHANGELOG.find(c => c.version === APP_VERSION);
  if (!currentChangelog) return null;

  return (
    <div className="version-notice-overlay" onClick={(e) => {
      if (e.target.classList.contains('version-notice-overlay')) handleDismiss();
    }}>
      <div className={`version-notice-modal ${animateOut ? 'animate-out' : 'animate-in'}`}>
        {/* Botón de cierre */}
        <button
          type="button"
          className="version-notice-close"
          onClick={handleDismiss}
          aria-label="Cerrar notificación"
        >
          <X size={20} />
        </button>

        {/* Cabecera con badge de versión */}
        <div className="version-notice-header">
          <div className="version-badge-glow">
            <Sparkles size={22} className="version-sparkle-icon" />
            <span className="version-badge-text">v{APP_VERSION}</span>
          </div>
          <h2 className="version-notice-title">
            ¡Nueva Actualización!
          </h2>
          <p className="version-notice-subtitle">
            {currentChangelog.title}
          </p>
          <span className="version-notice-date">{currentChangelog.date}</span>
        </div>

        {/* Lista de cambios */}
        <div className="version-notice-changes">
          {currentChangelog.changes.map((change, index) => (
            <div
              key={index}
              className="version-change-item"
              style={{ animationDelay: `${0.1 + index * 0.08}s` }}
            >
              <span className="version-change-icon">{change.icon}</span>
              <p className="version-change-text">{change.text}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <button type="button" className="version-notice-cta" onClick={handleDismiss}>
          <span>Entendido, ¡vamos!</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default VersionNotice;
