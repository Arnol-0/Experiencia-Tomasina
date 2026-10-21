import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Edit2 } from 'lucide-react';
import CredentialButton from './CredentialButton';
import { CREDENTIAL_CATALOG } from '../constants/credentials';
import { isCredentialDelivered } from '../utils/credentials';
import './StudentCard.css';

/**
 * ============================================================================
 * COMPONENTE: StudentCard (Tarjeta Resumen del Estudiante)
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTE COMPONENTE?
 * Renderiza una tarjeta visual para cada estudiante en el Directorio o Dashboard.
 * Muestra su foto/avatar, nombre, RUT, carrera, sede, conteo de pines obtenidos
 * y pines disponibles para desbloquear.
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. ISP (Interface Segregation Principle - Segregación de Interfaces):
 *    Solo recibe exactamente lo que necesita: `{ student, onEdit }`.
 *    No se le obliga a recibir el estado completo de la página, ni listas de otros alumnos,
 *    ni funciones pesadas de base de datos. Esto lo hace ligero, reutilizable y fácil de probar.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Su única responsabilidad es la presentación visual de los datos de un alumno.
 *    No sabe cómo se guardan los datos en Firebase ni cómo se descargan en Excel.
 */
const StudentCard = ({ student, onEdit, onDeliverCredential }) => {
  // --------------------------------------------------------------------------
  // 1. CÁLCULO DE PINES DISPONIBLES NO OBTENIDOS
  // --------------------------------------------------------------------------
  // Filtramos la lista de pines disponibles del estudiante:
  // Si un pin está en 'availablePins' pero NO está en 'collectedPins', significa
  // que el alumno ya cumple los requisitos pero aún no ha reclamado o desbloqueado la insignia.
  const uncollectedAvailable = (student.availablePins || []).filter(
    pinId => !(student.collectedPins || []).includes(pinId)
  );

  // Variable booleana: ¿Tiene al menos un pin listo para ser reclamado?
  const hasAvailable = uncollectedAvailable.length > 0;
  
  // --------------------------------------------------------------------------
  // 2. AVATAR / FOTO DE PERFIL CON FALLBACK INTELIGENTE
  // --------------------------------------------------------------------------
  // Si el estudiante tiene foto propia la usamos; si no, generamos automáticamente
  // un avatar con las iniciales de su nombre usando el servicio público ui-avatars.
  const avatarUrl = student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`;
  
  return (
    // Contenedor principal: Si tiene pines por reclamar, agrega la clase 'has-available-pins'
    // para destacar la tarjeta con un borde o resplandor llamativo.
    <div className={`student-card glass-panel animate-fade-in ${hasAvailable ? 'has-available-pins' : ''}`}>
      
      {/* SECCIÓN SUPERIOR: Avatar y Datos Personales */}
      <div className="student-header">
        {/* Imagen del estudiante */}
        <img src={avatarUrl} alt={student.name} className="student-avatar" />
        
        {/* Información del estudiante */}
        <div className="student-info">
          
          {/* Fila del nombre y botón de edición */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h3 className="student-name" style={{ margin: 0 }}>{student.name}</h3>
            
            {/* Si el padre pasó la función onEdit (es decir, el usuario tiene permisos), mostramos el lápiz */}
            {onEdit && (
              <button 
                // e.preventDefault() y e.stopPropagation() evitan que al hacer clic en el lápiz
                // se active el enlace de la tarjeta completa por accidente.
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(student); }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                title="Editar Estudiante"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {/* RUT del alumno (oculto si es un ID temporal generado por importación) */}
          {(student.rut || student.id) && !String(student.id).startsWith('imported') && (
            <span className="student-rut" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>
              RUT: {student.rut || student.id}
            </span>
          )}

          {/* Carrera o Programa Académico */}
          <span className="student-grade">{student.grade}</span>

          {/* Datos adicionales: Jornada (Diurna/Vespertina) e Institución / Sede */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {student.jornada && <span><strong>Jornada:</strong> {student.jornada}</span>}
            {student.branch && <span><strong>Institución:</strong> {student.branch}</span>}
          </div>
        </div>
      </div>
      
      {/* Biografía o descripción breve del estudiante */}
      <p className="student-bio">{student.bio}</p>
      
      {/* SECCIÓN DE ESTADÍSTICAS: Pines Obtenidos y Disponibles */}
      <div className="student-stats">
        {/* Conteo de pines ya ganados / completados */}
        <div className="stat">
          <span className="stat-value text-gradient">{(student.collectedPins || []).length}</span>
          <span className="stat-label">Obtenidos</span>
        </div>

        {/* Solo se muestra si el estudiante tiene pines esperando por ser desbloqueados */}
        {hasAvailable && (
          <div className="stat" style={{ marginLeft: '1.5rem' }}>
            <span className="stat-value" style={{ color: 'var(--color-primary)' }}>{uncollectedAvailable.length}</span>
            <span className="stat-label" style={{ color: 'var(--color-primary)', fontWeight: '600' }}>Disponibles</span>
          </div>
        )}
      </div>

      {/* ===== CREDENCIALES: Lanyard y Pasaporte =====
          Botones circulares: al hacer clic registran la entrega, el botón
          hace la animación de check y queda en verde de forma permanente
          porque se persiste en Firestore. */}
      <div className="student-credentials">
        <span className="student-credentials-title">Credenciales</span>
        <div className="credential-chips">
          {CREDENTIAL_CATALOG.map(credential => (
            <CredentialButton
              key={credential.id}
              credential={credential}
              size="sm"
              showLabel={false}
              delivered={isCredentialDelivered(student, credential.id)}
              canDeliver={typeof onDeliverCredential === 'function'}
              onDeliver={(credentialId) => onDeliverCredential(student.id, credentialId)}
            />
          ))}
        </div>
      </div>

      {/* Botón de acción: Enlace de React Router al perfil completo y mapa del recorrido */}
      <Link to={`/student/${student.id}`} className="student-action">
        Ver Recorrido <ChevronRight size={18} />
      </Link>
    </div>
  );
};

export default StudentCard;

