import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import PinCard from '../components/PinCard';
import CredentialButton from '../components/CredentialButton';
import { ArrowLeft, Award, X, Flag, Link as LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle, IdCard } from 'lucide-react';
import { CREDENTIAL_CATALOG } from '../constants/credentials';
import { isCredentialDelivered, getCredentialRecord, buildCredentialsMap } from '../utils/credentials';
import { canUnlockPins } from '../utils/permissions';
import vcmImg from '../assets/vcm.jpg';
import representantesImg from '../assets/representantes.jpg';
import internacionalImg from '../assets/internacional.jpg';
import orientacionImg from '../assets/Orientacion.jpg';
import liderazgoImg from '../assets/Liderazgo.jpg';
import destacadoImg from '../assets/Destacado.jpeg';
import bienestarImg from '../assets/Bienestar.jpg';
import semana0Img from '../assets/Semana0.jpg';
import proyectosImg from '../assets/Proyectos.jpg';
import articulacionImg from '../assets/Articulacion.jpg';
import voluntariadoImg from '../assets/Voluntariado.jpg';
import centroImg from '../assets/Centro.jpg';
import './StudentProfile.css';

const Icons = { Flag, Link: LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle };

export const PINS_CATALOG = [
  {
    id: 'pin_ivu', name: 'Semana 0/Programa IVU', description: 'Programa de Inducción', customImage: semana0Img, category: 'Inducción',
    requirementText: 'Debe participar a lo menos en 1 taller:',
    options: ['Participar de Semana 0', 'Participar de Progama Ivu']
  },
  {
    id: 'pin_articulacion', name: 'Articulación', description: 'Proceso de articulación', customImage: articulacionImg, category: 'Académico',
    requirementText: 'Requisito:',
    options: ['Matricularse en Programa de Articulacion']
  },
  {
    id: 'pin_voluntariado', name: 'Voluntariado', description: 'Acción social comunitaria', customImage: voluntariadoImg, category: 'Social',
    requirementText: 'Al menos una:',
    options: ['Mechoneo Solidario', 'Voluntariado Permanente', 'Trabajos Voluntariados de Invierno', 'Trabajo Voluntariados de Verano']
  },
  {
    id: 'pin_proyectos', name: 'Proyectos Estudiantiles', description: 'Iniciativas y fondos', customImage: proyectosImg, category: 'Desarrollo',
    requirementText: 'Al menos Una:',
    options: ['Adjudicar Fondos Concursables de la DAE', 'Pasar a semifinal Mercado E', 'Participar en concurso inserción en Lineas de Investigacion UST']
  },
  {
    id: 'pin_bienestar', name: 'Bienestar', description: 'Salud mental y física', customImage: bienestarImg, category: 'Salud',
    requirementText: 'Al menos una:',
    options: ['Taller Proposito de Vida', 'Capacitacion en primera ayuda Psicologica (Certificado)', 'Talleres DAE (3 ciclos de talleres, 70% de asistencia)']
  },
  {
    id: 'pin_centro_aprendizaje', name: 'Centro de Aprendizaje', description: 'Apoyo y tutorías', customImage: centroImg, category: 'Académico',
    requirementText: 'Participar de 6 o mas sesiones:',
    options: ['Talleres y tutorias del centro de aprendizaje']
  },
  {
    id: 'pin_liderazgo', name: 'Programa de Liderazgo', description: 'Escuela de formación', customImage: liderazgoImg, category: 'Liderazgo',
    requirementText: 'Al menos una:',
    options: ['Escuela de Lideres', 'Programa Fortaleciendo el Rol de los Representantes Estudiantiles']
  },
  {
    id: 'pin_orientacion', name: 'Orientación Profesional', description: 'Acompañamiento laboral', customImage: orientacionImg, category: 'Desarrollo',
    requirementText: 'Al menos una:',
    options: ['Participar al menos en el 70% de las actividades de la ruta de preparacion hacia el trabajo', 'Programa de orientación Profesional y Emprendimiento (minimo 2 asignaturas)']
  },
  {
    id: 'pin_destacado', name: 'Estudiante Destacado/a', description: 'Reconocimiento al mérito', customImage: destacadoImg, category: 'Reconocimiento',
    requirementText: 'Al menos una:',
    options: ['Beca Excelencia Académica', 'Premio Sello Santo Tomas']
  },
  {
    id: 'pin_representante', name: 'Representantes Tomasin@s', description: 'Vocería estudiantil', customImage: representantesImg, category: 'Liderazgo',
    requirementText: 'Al menos Una:',
    options: ['Torneo de debates', 'Cápitan de selecciones de ST o Deportista destacado', 'Participar de Organizaciones estudiantiles', 'Representante Estudiantil en comité CEDI', 'Estudiante Lider o Herman@ Tomasin@ (al menos 1 semestre)', 'Mentor del Programa de Mentoring Inclusivo', 'Mentor del Programa de Mentoring Vespertino', 'Mentor del Programa de Mentoring Socioafectivo', 'Estudiante que desarrolla talleres DAE (ciclo completo)', 'Formar parte del Team Admision']
  },
  {
    id: 'pin_internacional', name: 'Experiencia Internacional', description: 'Intercambio y movilidad', customImage: internacionalImg, category: 'Desarrollo',
    requirementText: 'Al menos una:',
    options: ['Experiencia de intercambio internacional', 'Programas en China del Instituto Confucio', 'Curso de chino mandarín básico 1']
  },
  {
    id: 'pin_vcm', name: 'Vinculación con el Medio', description: 'Impacto en el entorno', customImage: vcmImg, category: 'Social',
    requirementText: 'Al menos una:',
    options: ['Aprobar asignatura A+S', 'Adjudicar proyecto de innovacion social Vcm', 'Participar en los Programas Institucionales de VcM']
  },
];

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
   * Registra la entrega de una credencial (lanyard o pasaporte).
   *
   * 📌 Se guarda en el documento del estudiante (`credentials`) junto con la
   * fecha y el usuario que realizó la entrega, para que el check verde se
   * mantenga en las próximas visitas al perfil.
   */
  const handleDeliverCredential = async (credentialId) => {
    const credentials = buildCredentialsMap(
      student,
      credentialId,
      user?.email || user?.name
    );

    await updateStudent(student.id, { credentials });
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

      {/* ===== CREDENCIALES INSTITUCIONALES: Lanyard y Pasaporte ===== */}
      {/* Al marcar un botón, queda en verde con check y se mantiene así
          en las próximas visitas porque se persiste en Firestore. */}
      <div className="credentials-panel glass-panel animate-fade-in">
        <div className="section-title">
          <IdCard className="section-icon" />
          <h2>Credenciales del Estudiante</h2>
        </div>

        <p className="credentials-hint">
          Registra la entrega del <strong>lanyard</strong> y del <strong>pasaporte</strong>.
          Al marcar un botón queda en verde con check y se mantiene en las próximas visitas.
        </p>

        <div className="credentials-row">
          {CREDENTIAL_CATALOG.map(credential => (
            <CredentialButton
              key={credential.id}
              credential={credential}
              delivered={isCredentialDelivered(student, credential.id)}
              deliveredAt={getCredentialRecord(student, credential.id)?.deliveredAt}
              canDeliver={canDeliver}
              onDeliver={handleDeliverCredential}
            />
          ))}
        </div>

        {!canDeliver && (
          <p className="credentials-note">
            Sólo el personal con permisos (admin, coordinador o director) puede registrar entregas.
          </p>
        )}
      </div>

      {/* COLECCIÓN DE PINES: Grid con las 12 insignias */}
      <div className="profile-content" style={{ display: 'block' }}>
        <div className="pins-section animate-fade-in" style={{ animationDelay: '0.2s', width: '100%', margin: '0 auto' }}>
          <div className="section-title">
            <Award className="section-icon" />
            <h2>Colección de Pines</h2>
          </div>

          <div className="pins-grid">
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
