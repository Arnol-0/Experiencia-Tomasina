import React, { useState, useEffect } from 'react';
import BaseModal from './BaseModal';
import { Edit2, Check } from 'lucide-react';
import CustomSelect from '../CustomSelect';

const branchOptions = [
  { value: 'Arica', label: 'Arica' },
  { value: 'Iquique', label: 'Iquique' },
  { value: 'Antofagasta', label: 'Antofagasta' },
  { value: 'Copiapó', label: 'Copiapó' },
  { value: 'La Serena', label: 'La Serena' },
  { value: 'Ovalle', label: 'Ovalle' },
  { value: 'Viña del Mar', label: 'Viña del Mar' },
  { value: 'Santiago Centro', label: 'Santiago Centro' },
  { value: 'San Joaquín', label: 'San Joaquín' },
  { value: 'Estación Central', label: 'Estación Central' },
  { value: 'Puente Alto', label: 'Puente Alto' },
  { value: 'Rancagua', label: 'Rancagua' },
  { value: 'Curicó', label: 'Curicó' },
  { value: 'Talca', label: 'Talca' },
  { value: 'Chillán', label: 'Chillán' },
  { value: 'Concepción', label: 'Concepción' },
  { value: 'Los Ángeles', label: 'Los Ángeles' },
  { value: 'Temuco', label: 'Temuco' },
  { value: 'Valdivia', label: 'Valdivia' },
  { value: 'Osorno', label: 'Osorno' },
  { value: 'Puerto Montt', label: 'Puerto Montt' },
  { value: 'Punta Arenas', label: 'Punta Arenas' }
];

const instOptions = [
  { value: 'UST', label: 'Universidad Santo Tomás (UST)' },
  { value: 'IP', label: 'Instituto Profesional (IP)' },
  { value: 'CFT', label: 'Centro de Formación Técnica (CFT)' }
];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(student.id, formData);
      setMessage('Estudiante actualizado exitosamente.');
      setTimeout(() => {
        setMessage('');
        onClose();
      }, 1500);
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Editar Estudiante" icon={Edit2} maxWidth="500px">
      {message && (
        <div style={{ background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}
      <form onSubmit={handleSubmit} className="create-user-form">
        <div className="form-group">
          <label translate="no">RUT</label>
          <input type="text" value={formData.rut} onChange={e=>setFormData({...formData, rut: e.target.value})} placeholder="Ej: 12345678-9" />
        </div>
        <div className="form-group">
          <label>Nombre Completo</label>
          <input type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} required />
        </div>
        <div className="form-group">
          <label>Carrera / Programa</label>
          <input type="text" value={formData.grade} onChange={e=>setFormData({...formData, grade: e.target.value})} required />
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
        <div className="form-group">
          <label>Tipo de Institución</label>
          <CustomSelect 
            value={formData.institutionType} 
            onChange={(val) => setFormData({...formData, institutionType: val})} 
            options={instOptions} 
            placeholder="Seleccionar Institución" 
          />
        </div>
        <button type="submit" className="create-btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          <Check size={18} style={{ marginRight: '0.5rem' }} /> Guardar Cambios
        </button>
      </form>
    </BaseModal>
  );
};

export default EditStudentModal;
