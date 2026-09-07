import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../context/DataContext';
import PinCard from '../components/PinCard';
import { ArrowLeft, Award, X, Flag, Link as LinkIcon, Heart, Lightbulb, Smile, BookOpen, Crown, Compass, Star, Users, Globe, Lock, HelpCircle } from 'lucide-react';
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

const StudentProfile = () => {
  const { id } = useParams();
  const { studentsList, updateStudent } = useData();
  const student = studentsList.find(s => s.id === id);
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [isUnlocking, setIsUnlocking] = useState(false);

  if (!student) {
    return (
      <div className="container profile-not-found">
        <h2>Estudiante no encontrado</h2>
        <Link to="/" className="back-link"><ArrowLeft /> Volver al directorio</Link>
      </div>
    );
  }

  // TEST: Auto-add available pins to 21941033-6 for testing
  useEffect(() => {
    if (student && student.id === '21941033-6') {
      const currentAv = student.availablePins || [];
      const currentCollected = student.collectedPins || [];
      
      const testPins = ['pin_voluntariado', 'pin_destacado'];
      const pinsToAdd = testPins.filter(p => !currentCollected.includes(p) && !currentAv.includes(p));
      
      if (pinsToAdd.length > 0) {
        updateStudent(student.id, { availablePins: [...currentAv, ...pinsToAdd] });
      }
    }
  }, [student?.id]);

  const handlePinClick = (pin) => {
    const collected = student.collectedPins || [];
    const available = student.availablePins || [];
    
    if (!collected.includes(pin.id) && available.includes(pin.id)) {
      setSelectedPin(pin);
      setSelectedActivities([]);
    }
  };

  const handleUnlock = async () => {
    if (!selectedPin || selectedActivities.length === 0 || isUnlocking) return;
    
    setIsUnlocking(true);

    const collected = student.collectedPins || [];
    const newCollectedPins = [...collected, selectedPin.id];
    
    const available = student.availablePins || [];
    const newAvailablePins = available.filter(id => id !== selectedPin.id);

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
    setIsUnlocking(false);
  };

  return (
    <div className="student-profile-page container">
      <Link to="/directorio" className="back-link"><ArrowLeft size={20} /> Volver al directorio</Link>

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

      {selectedPin && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <button className="modal-close" onClick={() => setSelectedPin(null)}>
              <X size={24} />
            </button>
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
                        )
                      }}
                      className="activity-checkbox-input"
                    />
                    <span className="activity-checkbox-text">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

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
