import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Edit2, Check, User, ArrowRight } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { validationService } from '../../services/validationService';
import { branchOptions } from '../../constants/branches';


const instOptions = [
  { value: 'UST', label: 'Universidad Santo Tomás (UST)' },
  { value: 'IP', label: 'Instituto Profesional (IP)' },
  { value: 'CFT', label: 'Centro de Formación Técnica (CFT)' }
];

/**
 * ============================================================================
 * MODAL: EditStudentModal (Edición Rápida de Datos del Estudiante)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Solo se encarga del formulario para modificar datos de un alumno y mostrar
 *    la animación de transferencia visual.
 * 2. DIP (Inversión de Dependencias):
 *    No conoce la base de datos Firestore; recibe la función `onSave` como prop,
 *    invirtiéndose el control hacia el componente padre o el Context.
 * 3. Composición (OCP):
 *    Reutiliza <BaseModal> sin modificar su estructura interna.
 */
const EditStudentModal = ({ isOpen, onClose, student, onSave }) => {
  const [formData, setFormData] = useState({
    rut: '',
    name: '',
    grade: '',
    branch: '',
    institutionType: '',
    jornada: ''
  });
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  // Sincroniza el formulario cada vez que cambia el estudiante seleccionado
  useEffect(() => {
    if (student) {
      setFormData({
        rut: student.rut || '',
        name: student.name || '',
        grade: student.grade || '',
        branch: student.branch || '',
        institutionType: student.institutionType || '',
        jornada: student.jornada || ''
      });
    }
  }, [student]);

  // Maneja el guardado con validaciones previas de integridad
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // 1. VALIDACIÓN: Nombre y Carrera obligatorios
    if (!formData.name.trim()) {
      setMessage('Error: El nombre completo del estudiante es obligatorio.');
      return;
    }
    if (!formData.grade.trim()) {
      setMessage('Error: La carrera o programa académico es obligatorio.');
      return;
    }

    // 2. VALIDACIÓN: RUT (si viene ingresado, debe ser matemáticamente válido)
    const updatedData = { ...formData };
    if (formData.rut && formData.rut.trim()) {
      const rutValidation = validationService.validateRut(formData.rut);
      if (!rutValidation.isValid) {
        setMessage(`Error en RUT: ${rutValidation.error}`);
        return;
      }
      updatedData.rut = rutValidation.formatted; // Normalizamos formato con puntos y guion
    }

    setIsSaving(true);
    try {
      await onSave(student.id, updatedData);
      setMessage('Estudiante actualizado exitosamente.');
      setTimeout(() => {
        setMessage('');
        setIsSaving(false);
        onClose(); // Cierra el modal tras el éxito
      }, 1500);
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };


  // Si no está abierto o no hay estudiante seleccionado, no renderiza nada
  if (!isOpen || !student) return null;

  return (
    // Cascarón reutilizable con título e icono
    <BaseModal isOpen={isOpen} onClose={onClose} title="Editar Estudiante" icon={Edit2} maxWidth="500px">
      {/* Alerta de notificación de éxito o error */}
      {message && (
        <div style={{ background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}
      
      {/* RENDERIZADO CONDICIONAL: Si se está guardando, muestra la animación de transferencia */}
      {isSaving ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', gap: '1.5rem' }}>
          {/* Animación con flecha móvil entre dos iconos de usuario */}
          <div style={{ position: 'relative', width: '120px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="var(--color-primary)" />
            </div>
            <ArrowRight size={24} color="var(--color-primary)" className="transfer-arrow-anim" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }} />
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={24} color="white" />
            </div>
          </div>
          <h3 style={{ margin: 0, color: 'var(--color-primary-dark)' }}>Transferencia en progreso...</h3>
          <p style={{ color: 'var(--text-muted)', margin: 0 }}>Actualizando datos de {formData.name}</p>
        </div>
      ) : (
        // FORMULARIO DE EDICIÓN
        <form onSubmit={handleSubmit} className="create-user-form">
          {/* Fila: RUT y Nombre */}
          <div className="form-row">
            <div className="form-group">
              <label translate="no">RUT (opcional)</label>
              <input 
                type="text" 
                value={formData.rut} 
                onChange={e => setFormData({...formData, rut: e.target.value})} 
                placeholder="Ej: 12345678-9" 
              />
            </div>
            <div className="form-group">
              <label>Nombre Completo</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                required 
              />
            </div>
          </div>

          {/* Fila: Carrera y Sede */}
          <div className="form-row">
            <div className="form-group">
              <label>Carrera / Programa</label>
              <input 
                type="text" 
                value={formData.grade} 
                onChange={e => setFormData({...formData, grade: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Sede (Corrección)</label>
              <CustomSelect 
                value={formData.branch} 
                onChange={(val) => setFormData({...formData, branch: val})} 
                options={branchOptions} 
                placeholder="Seleccionar Sede" 
              />
            </div>
          </div>
          
          {/* Fila: Tipo de Institución (UST, IP, CFT) */}
          <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Tipo de Institución</label>
              <CustomSelect 
                value={formData.institutionType} 
                onChange={(val) => setFormData({...formData, institutionType: val})} 
                options={instOptions} 
                placeholder="Seleccionar Institución" 
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" className="create-btn" style={{ flex: 1, justifyContent: 'center', marginTop: 0 }}>
              <Check size={18} style={{ marginRight: '0.5rem' }} /> Guardar Cambios
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export default EditStudentModal;
