import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PinCard from '../components/PinCard';
import { ArrowLeft, Award, X, Flag, Link as LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle } from 'lucide-react';
import { CREDENTIAL_CATALOG } from '../constants/credentials';
import { isCredentialDelivered, buildCredentialsMap } from '../utils/credentials';
import { canUnlockPins } from '../utils/permissions';
import { PINS_CATALOG } from '../constants/pinsCatalog';
import './StudentProfile.css';

export { PINS_CATALOG };

const Icons = { Flag, Link: LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle };


/**
 * ============================================================================
 * PÁGINA: StudentProfile (Perfil del Estudiante y Recorrido de Pines)
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTA PÁGINA?
 * - Muestra el detalle del estudiante: nombre, carrera, jornada, institución y sede.
 * - Despliega el catálogo de las 12 insignias o pines formativos.
 * - Permite al coordinador o directivo desbloquear un pin cuando el alumno
 *   cumple y valida la actividad requerida.
 * - Registra la fecha y actividad exacta en el historial del estudiante (`unlockRecords`).
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. DIP (Inversión de Dependencias):
 *    Utiliza `useData()` para persistir los cambios sin acoplarse a la API de Firestore.
 * 2. ISP (Segregación de Interfaces):
 *    Renderiza cada insignia mediante el componente especializado <PinCard />, pasando
 *    únicamente los estados que le competen a esa tarjeta (`isCollected`, `isAvailable`).
 * 3. SRP (Responsabilidad Única):
 *    Esta pantalla solo gestiona el viaje del estudiante y la validación de sus requisitos.
 */
const StudentProfile = () => {
  // 1. Obtiene el parámetro de la URL (el ID o RUT del estudiante, ej: /student/12345678-9)
  const { id } = useParams();
  
  // 2. Inversión de dependencias (DIP): Extrae la lista y el actualizador global
  const { studentsList, updateStudent } = useData();
  const student = studentsList.find(s => s.id === id);

  // 3. Usuario de la sesión: determina si puede registrar entregas de credenciales
  const { user } = useAuth();
  const canDeliver = canUnlockPins(user);

  // Estados locales para el modal de desbloqueo de pines
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isUnlocking, setIsUnlocking] = useState(false);

  // 📌 ENTREGAS OPTIMISTAS DE CREDENCIALES:
  // Guardamos localmente la entrega recién confirmada para que la tarjeta pase
  // al estado "obtenido" (con su animación) en el mismo instante del clic, sin
  // esperar el viaje de ida y vuelta a Firestore ni la actualización del listener.
  const [pendingCredentials, setPendingCredentials] = useState({});
  const [celebratingCredential, setCelebratingCredential] = useState(null);
  const [credentialError, setCredentialError] = useState('');

  // Si el estudiante no existe o aún está cargando la base de datos
  if (!student) {
    return (
      <div className="container profile-not-found">
        <h2>Estudiante no encontrado</h2>
        <Link to="/" className="back-link"><ArrowLeft /> Volver al directorio</Link>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VISTA COMBINADA DEL ESTUDIANTE
  // --------------------------------------------------------------------------
  // 📌 Mezcla lo que ya está guardado en Firestore con las entregas confirmadas
  // en esta sesión, para que la tarjeta reaccione al clic inmediatamente.
  const studentView = {
    ...student,
    credentials: { ...(student.credentials || {}), ...pendingCredentials }
  };

  // --------------------------------------------------------------------------
  // INTERACCIÓN: Clic sobre un Pin
  // --------------------------------------------------------------------------
  const handlePinClick = (pin) => {
    const collected = student.collectedPins || [];
    const available = student.availablePins || [];
    
    // Solo permitimos abrir el modal de desbloqueo si el pin está disponible y no ha sido ganado aún
    if (!collected.includes(pin.id) && available.includes(pin.id)) {
      setSelectedPin(pin);
      setSelectedActivities([]); // Reiniciamos actividades marcadas
    }
  };

  // --------------------------------------------------------------------------
  // PROCESO DE DESBLOQUEO DEL PIN
  // --------------------------------------------------------------------------
  const handleUnlock = async () => {
    // Validación: debe haber seleccionado al menos una actividad y no estar ya guardando
    if (!selectedPin || selectedActivities.length === 0 || isUnlocking) return;
    
    setIsUnlocking(true);

    // 1. Agregamos el pin a la lista de pines obtenidos
    const collected = student.collectedPins || [];
    const newCollectedPins = [...collected, selectedPin.id];
    
    // 2. Lo removemos de la lista de pendientes/disponibles
    const available = student.availablePins || [];
    const newAvailablePins = available.filter(pinId => pinId !== selectedPin.id);

    // 3. Guardamos registro de auditoría con la fecha ISO y las actividades seleccionadas
    const unlockRecords = student.unlockRecords || {};
    const newUnlockRecords = {
      ...unlockRecords,
      [selectedPin.id]: {
        date: new Date().toISOString(),
        activity: selectedActivities.join(', ')
      }
    };

    // 4. Invocamos actualización atómica a través del contexto
    await updateStudent(student.id, {
      collectedPins: newCollectedPins,
      unlockRecords: newUnlockRecords,
      availablePins: newAvailablePins
    });

    // 5. Cerramos el modal de desbloqueo y reseteamos el estado de carga
    setSelectedPin(null);
    setIsUnlocking(false);
  };

  // --------------------------------------------------------------------------
  // PROCESO: Entrega de credenciales (lanyard / pasaporte)
  // --------------------------------------------------------------------------
  /**
   * Registra la entrega de Lanyard o Pasaporte.
   *
   * 📌 Flujo (UI optimista):
   * 1. Se pinta la tarjeta como "obtenida" al instante → dispara la misma
   *    animación de pulso verde que un pin recién desbloqueado.
   * 2. Se persiste la entrega en Firestore (`students/{id}.credentials`).
   * 3. Si la escritura falla, se revierte el estado visual y se muestra el
   *    error, de modo que nunca quede una tarjeta "entregada" sin guardar.
   */
  const handleDeliverCredential = async (credential) => {
    if (isCredentialDelivered(studentView, credential.id)) return;

    const credentials = buildCredentialsMap(
      studentView,
      credential.id,
      user?.email || user?.name
    );

    // 1. Feedback inmediato: estado "obtenido" + animación de entrega.
    setCredentialError('');
    setPendingCredentials(prev => ({ ...prev, [credential.id]: credentials[credential.id] }));
    setCelebratingCredential(credential.id);
    setTimeout(() => setCelebratingCredential(null), 1200);

    // 2. Persistencia en Firestore.
    try {
      await updateStudent(student.id, { credentials });
    } catch (error) {
      // 3. Reversión: si no se guardó, la tarjeta vuelve a "disponible".
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

      {/* ===== COLECCIÓN: Lanyard, Pasaporte y los 12 pines formativos =====
          Las credenciales usan el mismo componente y estados que los pines:
          candado brillante cuando están disponibles y animación de "obtenido"
          al confirmar la entrega con un clic. */}
      <div className="profile-content" style={{ display: 'block' }}>
        <div className="pins-section animate-fade-in" style={{ animationDelay: '0.2s', width: '100%', margin: '0 auto' }}>
          <div className="section-title">
            <Award className="section-icon" />
            <h2>Colección</h2>
          </div>

          <div className="pins-grid">
            {CREDENTIAL_CATALOG.map(credential => {
              const delivered = isCredentialDelivered(studentView, credential.id);
              const isAvailable = canDeliver && !delivered;
              const credentialPin = {
                id: credential.id,
                name: credential.label,
                description: credential.description,
                category: 'Entrega',
                icon: credential.icon
              };

              return (
                <PinCard
                  key={credential.id}
                  pin={credentialPin}
                  isCollected={delivered}
                  isAvailable={isAvailable}
                  onClick={isAvailable ? () => handleDeliverCredential(credential) : undefined}
                  className={celebratingCredential === credential.id ? 'just-delivered' : ''}
                />
              );
            })}

            {PINS_CATALOG.map(pin => (
              <PinCard
                key={pin.id}
                pin={pin}
                isCollected={(student.collectedPins || []).includes(pin.id)}
                isAvailable={(student.availablePins || []).includes(pin.id)}
                onClick={() => handlePinClick(pin)}
                icons={Icons}
              />
            ))}
          </div>

          {/* Sólo aparece si Firestore rechazó la entrega: la tarjeta volvió a
              su estado anterior y aquí se explica el motivo. */}
          {credentialError && (
            <p className="credential-error">{credentialError}</p>
          )}
        </div>
      </div>

      {/* MODAL DE DESBLOQUEO: Solo se abre cuando el usuario hace clic en un pin disponible */}
      {selectedPin && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            {/* Botón para cerrar */}
            <button className="modal-close" onClick={() => setSelectedPin(null)}>
              <X size={24} />
            </button>
            
            <h2 className="modal-title text-gradient">
              Desbloquear Pin: {selectedPin.name}
            </h2>

            {/* Requisitos del catálogo para este pin */}
            <div className="pin-requirement">
              <h4>Requisito para desbloquear:</h4>
              <p>{selectedPin.requirementText}</p>
              <ul className="pin-options-list">
                {selectedPin.options.map((opt, i) => (
                  <li key={i}>{opt}</li>
                ))}
              </ul>
            </div>

            {/* Lista de actividades para marcar con checkbox */}
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
                        )
                      }}
                      className="activity-checkbox-input"
                    />
                    <span className="activity-checkbox-text">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Botón para confirmar y desbloquear con barra de progreso */}
            <button
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
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;
