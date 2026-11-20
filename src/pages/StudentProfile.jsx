import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PinCard from '../components/PinCard';
import TermoTracker from '../components/TermoTracker';
import TermoCelebrationModal from '../components/TermoCelebrationModal';
import { 
  ArrowLeft, Award, X, Flag, Link as LinkIcon, Heart, Lightbulb, Smile, 
  BookOpen, Crown, Compass, Star, Users, Globe, Lock, Unlock, HelpCircle, 
  ShieldCheck, CheckCircle, AlertTriangle, Sparkles 
} from 'lucide-react';
import { CREDENTIAL_CATALOG } from '../constants/credentials';
import { isCredentialDelivered, buildCredentialsMap } from '../utils/credentials';
import { canUnlockPins, canDeliverCredentials, canManagePinStatus } from '../utils/permissions';
import { PINS_CATALOG } from '../constants/pinsCatalog';
import './StudentProfile.css';

export { PINS_CATALOG };

const Icons = { Flag, Link: LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle };

/**
 * ============================================================================
 * PÁGINA: StudentProfile (Perfil del Estudiante, Recorrido de Pines y Termo)
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTA PÁGINA?
 * - Muestra el detalle del estudiante: nombre, carrera, jornada, institución y sede.
 * - Despliega el catálogo de insignias y credenciales.
 * - Muestra en el lateral derecho el Termo Tomasino que se va llenando hasta 7 pines.
 * - Alerta cuando se alcanzan 7 pines para desbloquear y registrar la entrega del termo.
 * - Permite al Admin y Coordinador bloquear y desbloquear cualquier pin directamente.
 */
const StudentProfile = () => {
  // 1. Obtiene el parámetro de la URL (el ID o RUT del estudiante)
  const { id } = useParams();
  
  // 2. Inversión de dependencias (DIP): Extrae la lista y el actualizador global
  const { studentsList, updateStudent } = useData();
  const student = studentsList.find(s => s.id === id);

  // 3. Usuario de la sesión y permisos granulares (Admin, Coordinador y Director DAE pueden gestionar pines)
  const { user } = useAuth();
  const canDeliver = canDeliverCredentials(user);
  const canUnlock = canUnlockPins(user);
  const canManagePins = canManagePinStatus(user);

  // Estados locales para el modal de desbloqueo y gestión de pines
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isProcessingTermo, setIsProcessingTermo] = useState(false);

  // Entregas optimistas de credenciales
  const [pendingCredentials, setPendingCredentials] = useState({});
  const [celebratingCredential, setCelebratingCredential] = useState(null);
  const [credentialError, setCredentialError] = useState('');

  // Si el estudiante no existe o aún está cargando la base de datos
  if (!student) {
    return (
      <div className="container profile-not-found">
        <h2>Estudiante no encontrado</h2>
        <Link to="/directorio" className="back-link"><ArrowLeft /> Volver al directorio</Link>
      </div>
    );
  }

  // Vista combinada del estudiante con credenciales optimistas
  const studentView = {
    ...student,
    credentials: { ...(student.credentials || {}), ...pendingCredentials }
  };

  // Contadores de pines obtenidos
  const collectedPins = student.collectedPins || [];
  const availablePins = student.availablePins || [];
  const collectedCount = collectedPins.length;

  // Estado del Termo
  const isTermoDelivered = Boolean(student.credentials?.termo?.delivered || student.termoDelivered);
  const termoRecord = student.credentials?.termo || student.termoRecord || null;

  // Estado para la notificación central de celebración a los 7 pines
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [hasAutoOpenedCelebration, setHasAutoOpenedCelebration] = useState(false);

  // Al llegar al séptimo pin (7 o más) y no haber sido entregado aún,
  // se muestra automáticamente la notificación en medio una vez por sesión
  useEffect(() => {
    if (collectedCount >= 7 && !isTermoDelivered && !hasAutoOpenedCelebration) {
      setShowCelebrationModal(true);
      setHasAutoOpenedCelebration(true);
    }
  }, [collectedCount, isTermoDelivered, hasAutoOpenedCelebration]);

  // --------------------------------------------------------------------------
  // INTERACCIÓN: Clic sobre un Pin
  // --------------------------------------------------------------------------
  const handlePinClick = (pin) => {
    // Admin y Coordinador pueden gestionar CUALQUIER pin (bloqueado, disponible u obtenido)
    if (canManagePins) {
      setSelectedPin(pin);
      setSelectedActivities([]);
      return;
    }

    // Usuario estándar: solo abre si está disponible y aún no obtenido
    if (canUnlock) {
      if (!collectedPins.includes(pin.id) && availablePins.includes(pin.id)) {
        setSelectedPin(pin);
        setSelectedActivities([]);
      }
    }
  };

  // --------------------------------------------------------------------------
  // PROCESO ESTÁNDAR: Desbloqueo de Pin validando requisitos
  // --------------------------------------------------------------------------
  const handleUnlock = async () => {
    if (!selectedPin || selectedActivities.length === 0 || isUnlocking) return;
    setIsUnlocking(true);

    try {
      const newCollectedPins = [...collectedPins, selectedPin.id];
      const newAvailablePins = availablePins.filter(pinId => pinId !== selectedPin.id);

      const unlockRecords = student.unlockRecords || {};
      const newUnlockRecords = {
        ...unlockRecords,
        [selectedPin.id]: {
          date: new Date().toISOString(),
          activity: selectedActivities.join(', ')
        }
      };

      await updateStudent(student.id, {
        collectedPins: newCollectedPins,
        unlockRecords: newUnlockRecords,
        availablePins: newAvailablePins
      });

      setSelectedPin(null);
    } catch (error) {
      console.error('Error al desbloquear pin:', error);
    } finally {
      setIsUnlocking(false);
    }
  };

  // --------------------------------------------------------------------------
  // GESTIÓN ADMINISTRATIVA: Bloquear y Desbloquear Pines (Admin y Coordinador)
  // --------------------------------------------------------------------------

  // 1. Desbloqueo directo por Administración
  const handleDirectUnlockPin = async (pinId) => {
    if (!canManagePins || isUnlocking) return;
    setIsUnlocking(true);

    try {
      const newCollectedPins = collectedPins.includes(pinId) ? collectedPins : [...collectedPins, pinId];
      const newAvailablePins = availablePins.filter(id => id !== pinId);

      const unlockRecords = student.unlockRecords || {};
      const newUnlockRecords = {
        ...unlockRecords,
        [pinId]: {
          date: new Date().toISOString(),
          activity: 'Desbloqueo manual por Administración'
        }
      };

      await updateStudent(student.id, {
        collectedPins: newCollectedPins,
        availablePins: newAvailablePins,
        unlockRecords: newUnlockRecords
      });

      setSelectedPin(null);
    } catch (err) {
      console.error('Error en desbloqueo directo:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 2. Habilitar pin como Disponible (pendiente de entrega)
  const handleMakePinAvailable = async (pinId) => {
    if (!canManagePins || isUnlocking) return;
    setIsUnlocking(true);

    try {
      const newAvailablePins = availablePins.includes(pinId) ? availablePins : [...availablePins, pinId];
      const newCollectedPins = collectedPins.filter(id => id !== pinId);

      const unlockRecords = { ...(student.unlockRecords || {}) };
      delete unlockRecords[pinId];

      await updateStudent(student.id, {
        availablePins: newAvailablePins,
        collectedPins: newCollectedPins,
        unlockRecords
      });

      setSelectedPin(null);
    } catch (err) {
      console.error('Error al habilitar pin disponible:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 3. Bloquear pin (remover tanto de obtenidos como de disponibles)
  const handleLockPin = async (pinId) => {
    if (!canManagePins || isUnlocking) return;
    setIsUnlocking(true);

    try {
      const newCollectedPins = collectedPins.filter(id => id !== pinId);
      const newAvailablePins = availablePins.filter(id => id !== pinId);

      const unlockRecords = { ...(student.unlockRecords || {}) };
      delete unlockRecords[pinId];

      await updateStudent(student.id, {
        collectedPins: newCollectedPins,
        availablePins: newAvailablePins,
        unlockRecords
      });

      setSelectedPin(null);
    } catch (err) {
      console.error('Error al bloquear pin:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 4. Mover de Obtenido a Disponible
  const handleMovePinToAvailable = async (pinId) => {
    if (!canManagePins || isUnlocking) return;
    setIsUnlocking(true);

    try {
      const newCollectedPins = collectedPins.filter(id => id !== pinId);
      const newAvailablePins = availablePins.includes(pinId) ? availablePins : [...availablePins, pinId];

      const unlockRecords = { ...(student.unlockRecords || {}) };
      delete unlockRecords[pinId];

      await updateStudent(student.id, {
        collectedPins: newCollectedPins,
        availablePins: newAvailablePins,
        unlockRecords
      });

      setSelectedPin(null);
    } catch (err) {
      console.error('Error al mover pin a disponible:', err);
    } finally {
      setIsUnlocking(false);
    }
  };

  // --------------------------------------------------------------------------
  // PROCESO: Entrega y Reversión de Credenciales (Lanyard / Pasaporte)
  // --------------------------------------------------------------------------
  const handleDeliverCredential = async (credential) => {
    if (isCredentialDelivered(studentView, credential.id)) return;

    const credentials = buildCredentialsMap(
      studentView,
      credential.id,
      user?.email || user?.name
    );

    setCredentialError('');
    setPendingCredentials(prev => ({ ...prev, [credential.id]: credentials[credential.id] }));
    setCelebratingCredential(credential.id);
    setTimeout(() => setCelebratingCredential(null), 1200);

    try {
      await updateStudent(student.id, { credentials });
    } catch (error) {
      console.error('No se pudo registrar la entrega de la credencial:', error);
      setPendingCredentials(prev => {
        const next = { ...prev };
        delete next[credential.id];
        return next;
      });
      setCelebratingCredential(null);
      setCredentialError('No se pudo registrar la entrega. Revisa tu conexión e inténtalo nuevamente.');
    }
  };

  const handleRevokeCredential = async (credentialId) => {
    if (!canManagePins) return;
    if (!window.confirm('¿Seguro que deseas revertir o bloquear la entrega de esta credencial?')) return;

    try {
      const updatedCredentials = { ...(student.credentials || {}) };
      delete updatedCredentials[credentialId];
      await updateStudent(student.id, { credentials: updatedCredentials });
    } catch (err) {
      console.error('Error al revocar credencial:', err);
    }
  };

  // --------------------------------------------------------------------------
  // RECOMPENSA: Desbloquear y Revertir Termo Tomasino
  // --------------------------------------------------------------------------
  const handleUnlockTermo = async () => {
    if (isTermoDelivered || isProcessingTermo) return;
    setIsProcessingTermo(true);

    try {
      const nowIso = new Date().toISOString();
      const deliveredBy = user?.email || user?.name || 'Administración';
      const record = {
        delivered: true,
        deliveredAt: nowIso,
        deliveredBy
      };

      const updatedCredentials = {
        ...(student.credentials || {}),
        termo: record
      };

      await updateStudent(student.id, {
        credentials: updatedCredentials,
        termoDelivered: true,
        termoRecord: record
      });
    } catch (err) {
      console.error('Error al entregar el termo:', err);
    } finally {
      setIsProcessingTermo(false);
    }
  };

  const handleRevokeTermo = async () => {
    if (!canManagePins || isProcessingTermo) return;
    if (!window.confirm('¿Seguro que deseas revertir la entrega del termo a este estudiante?')) return;
    setIsProcessingTermo(true);

    try {
      const updatedCredentials = { ...(student.credentials || {}) };
      delete updatedCredentials.termo;

      await updateStudent(student.id, {
        credentials: updatedCredentials,
        termoDelivered: false,
        termoRecord: null
      });
    } catch (err) {
      console.error('Error al revertir entrega del termo:', err);
    } finally {
      setIsProcessingTermo(false);
    }
  };

  return (
    <div className="student-profile-page container">
      {/* Enlace para regresar a la vista de Directorio */}
      <Link to="/directorio" className="back-link">
        <ArrowLeft size={20} /> Volver al directorio
      </Link>

      {/* CABECERA DEL PERFIL: Avatar, Nombre, Carrera e Institución */}
      <div className="profile-header glass-panel animate-fade-in">
        <img src={student.avatar} alt={student.name} className="profile-avatar" />
        <div className="profile-info">
          <h1 className="profile-name text-gradient">{student.name}</h1>
          <span className="profile-grade">
            {student.grade} {student.jornada ? ` | Jornada: ${student.jornada}` : ''}
          </span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>
            Institución: {student.institutionType || 'N/A'} | Sede: {student.branch}
          </span>
          <p className="profile-bio">{student.bio}</p>
        </div>
      </div>

      {/* LAYOUT PRINCIPAL: Lado Izquierdo Colección + Lado Derecho Termo Tracker */}
      <div className="profile-main-layout">
        {/* LADO IZQUIERDO: Colección de credenciales y pines */}
        <div className="pins-section animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="section-title">
            <Award className="section-icon" />
            <h2>Colección</h2>
            {canManagePins && (
              <span className="admin-badge-indicator" title="Eres Admin, Coordinador o Director DAE: puedes hacer clic en cualquier pin para bloquearlo o desbloquearlo">
                <ShieldCheck size={16} /> Modo Gestión (DAE)
              </span>
            )}
          </div>

          <div className="pins-grid">
            {/* 1. CREDENCIALES: Lanyard y Pasaporte */}
            {CREDENTIAL_CATALOG.map(credential => {
              const delivered = isCredentialDelivered(studentView, credential.id);
              const isAvailable = canDeliver && !delivered;
              const isClickable = isAvailable || (delivered && canManagePins);

              const credentialPin = {
                id: credential.id,
                name: credential.label,
                description: credential.description,
                category: 'Entrega',
                icon: credential.icon
              };

              const handleClick = () => {
                if (isAvailable) {
                  handleDeliverCredential(credential);
                } else if (delivered && canManagePins) {
                  handleRevokeCredential(credential.id);
                }
              };

              return (
                <PinCard
                  key={credential.id}
                  pin={credentialPin}
                  isCollected={delivered}
                  isAvailable={isAvailable}
                  onClick={isClickable ? handleClick : undefined}
                  className={celebratingCredential === credential.id ? 'just-delivered' : ''}
                />
              );
            })}

            {/* 2. PINES FORMATIVOS */}
            {PINS_CATALOG.map(pin => {
              const isCollected = collectedPins.includes(pin.id);
              const isAvailable = availablePins.includes(pin.id);
              const isClickable = canManagePins || (canUnlock && isAvailable);

              return (
                <PinCard
                  key={pin.id}
                  pin={pin}
                  isCollected={isCollected}
                  isAvailable={isAvailable}
                  onClick={isClickable ? () => handlePinClick(pin) : undefined}
                  icons={Icons}
                />
              );
            })}
          </div>

          {credentialError && (
            <p className="credential-error">{credentialError}</p>
          )}
        </div>

        {/* LADO DERECHO: TERMO TOMASINO (SOMBRA + RELLENO + ALARMA A LOS 7 PINES) */}
        <aside className="termo-sidebar animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <TermoTracker
            collectedCount={collectedCount}
            targetCount={7}
            isDelivered={isTermoDelivered}
            deliveredRecord={termoRecord}
            canUnlock={canUnlock || canManagePins}
            canManage={canManagePins}
            isProcessing={isProcessingTermo}
            onUnlock={() => setShowCelebrationModal(true)}
            onRevoke={handleRevokeTermo}
          />
        </aside>
      </div>

      {/* NOTIFICACIÓN CENTRAL AL LLEGAR AL SÉPTIMO PIN */}
      <TermoCelebrationModal
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        studentName={student.name}
        isDelivered={isTermoDelivered}
        isProcessing={isProcessingTermo}
        onUnlock={handleUnlockTermo}
      />

      {/* =========================================================================
          MODAL DE GESTIÓN Y DESBLOQUEO DE PINES
          Soporta 3 estados:
          1. Ya Obtenido (Admin puede bloquear/revocar o mover a disponible)
          2. Bloqueado (Admin puede desbloquear directamente o habilitar como disponible)
          3. Disponible (Flujo regular con checkboxes + botón admin para volver a bloquear)
          ========================================================================= */}
      {selectedPin && (
        <div 
          className="modal-overlay" 
          onClick={(e) => { 
            if (e.target.classList.contains('modal-overlay')) setSelectedPin(null); 
          }}
        >
          <div className="modal-content animate-fade-in">
            <button 
              type="button" 
              className="modal-close" 
              onClick={() => setSelectedPin(null)}
              aria-label="Cerrar modal"
            >
              <X size={24} />
            </button>

            {/* CASO A: Pin YA OBTENIDO (Gestión administrativa) */}
            {collectedPins.includes(selectedPin.id) ? (
              <div className="pin-admin-manage-section">
                <div className="pin-manage-header">
                  <div className="pin-manage-icon-wrapper collected">
                    <CheckCircle size={32} />
                  </div>
                  <div>
                    <span className="pin-badge-status collected">✓ Pin Obtenido</span>
                    <h2 className="modal-title">{selectedPin.name}</h2>
                    <span className="pin-manage-category">{selectedPin.category}</span>
                  </div>
                </div>

                <div className="pin-manage-details-box">
                  <h4>Registro de obtención:</h4>
                  {student.unlockRecords?.[selectedPin.id] ? (
                    <ul className="pin-audit-list">
                      <li>
                        <strong>Fecha:</strong>{' '}
                        {new Date(student.unlockRecords[selectedPin.id].date).toLocaleDateString('es-CL', {
                          day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </li>
                      <li>
                        <strong>Actividad registrada:</strong>{' '}
                        {student.unlockRecords[selectedPin.id].activity || 'Validación DAE'}
                      </li>
                    </ul>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Insignia acreditada en el sistema.
                    </p>
                  )}
                </div>

                {canManagePins && (
                  <div className="admin-actions-group">
                    <p className="admin-action-hint">
                      Como Administrador, Coordinador o Director DAE, puedes revocar o cambiar el estado de este pin:
                    </p>
                    <div className="admin-buttons-row">
                      <button
                        type="button"
                        className="btn-admin-danger"
                        onClick={() => handleLockPin(selectedPin.id)}
                        disabled={isUnlocking}
                      >
                        <Lock size={16} />
                        <span>Bloquear Pin (Revocar)</span>
                      </button>
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => handleMovePinToAvailable(selectedPin.id)}
                        disabled={isUnlocking}
                      >
                        <Unlock size={16} />
                        <span>Mover a Disponible</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : !availablePins.includes(selectedPin.id) ? (
              /* CASO B: Pin BLOQUEADO (Gestión administrativa) */
              <div className="pin-admin-manage-section">
                <div className="pin-manage-header">
                  <div className="pin-manage-icon-wrapper locked">
                    <Lock size={32} />
                  </div>
                  <div>
                    <span className="pin-badge-status locked">🔒 Pin Bloqueado</span>
                    <h2 className="modal-title">{selectedPin.name}</h2>
                    <span className="pin-manage-category">{selectedPin.category}</span>
                  </div>
                </div>

                <div className="pin-requirement">
                  <h4>Requisito regular:</h4>
                  <p>{selectedPin.requirementText}</p>
                  <ul className="pin-options-list">
                    {selectedPin.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>

                {canManagePins && (
                  <div className="admin-actions-group">
                    <p className="admin-action-hint">
                      Gestión administrativa directa para este estudiante:
                    </p>
                    <div className="admin-buttons-row">
                      <button
                        type="button"
                        className="btn-admin-primary"
                        onClick={() => handleDirectUnlockPin(selectedPin.id)}
                        disabled={isUnlocking}
                      >
                        <Sparkles size={16} />
                        <span>Desbloquear Directamente</span>
                      </button>
                      <button
                        type="button"
                        className="btn-admin-secondary"
                        onClick={() => handleMakePinAvailable(selectedPin.id)}
                        disabled={isUnlocking}
                      >
                        <Unlock size={16} />
                        <span>Habilitar como Disponible</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CASO C: Pin DISPONIBLE (Flujo regular con checkboxes + bloqueo para admin) */
              <div>
                <h2 className="modal-title text-gradient">
                  Desbloquear Pin: {selectedPin.name}
                </h2>

                <div className="pin-requirement">
                  <h4>Requisito para desbloquear:</h4>
                  <p>{selectedPin.requirementText}</p>
                  <ul className="pin-options-list">
                    {selectedPin.options.map((opt, i) => (
                      <li key={i}>{opt}</li>
                    ))}
                  </ul>
                </div>

                <div className="form-group options-group">
                  <label className="options-label">
                    Selecciona la(s) actividad(es) realizada(s):
                  </label>
                  <div className="activities-checkbox-list">
                    {selectedPin.options.map((opt, i) => (
                      <label key={i} className="activity-checkbox-label">
                        <input
                          type="checkbox"
                          checked={selectedActivities.includes(opt)}
                          onChange={() => {
                            setSelectedActivities(prev =>
                              prev.includes(opt)
                                ? prev.filter(a => a !== opt)
                                : [...prev, opt]
                            );
                          }}
                          className="activity-checkbox-input"
                        />
                        <span className="activity-checkbox-text">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className={`unlock-btn ${isUnlocking ? 'is-loading' : ''}`}
                  onClick={handleUnlock}
                  disabled={selectedActivities.length === 0 || isUnlocking}
                >
                  {isUnlocking ? (
                    <div className="btn-loading-content">
                      <span>Desbloqueando...</span>
                      <div className="progress-bar-wrapper">
                        <div className="progress-bar-fill"></div>
                      </div>
                    </div>
                  ) : (
                    'Confirmar y Desbloquear'
                  )}
                </button>

                {canManagePins && (
                  <div className="admin-modal-footer">
                    <button
                      type="button"
                      className="btn-admin-danger-text"
                      onClick={() => handleLockPin(selectedPin.id)}
                      disabled={isUnlocking}
                    >
                      <Lock size={15} /> Volver a Bloquear Pin (Gestión)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
