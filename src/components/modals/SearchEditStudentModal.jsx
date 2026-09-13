import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Search, Edit2, Check, X, User } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { useData } from '../../context/DataContext';

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

const SearchEditStudentModal = ({ isOpen, onClose, user }) => {
  const { studentsList, updateStudent } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  const isGlobal = user?.role === 'admin';
  const relevantStudents = isGlobal 
    ? studentsList 
    : studentsList.filter(s => s.branch === user?.branch);

  const filteredStudents = searchTerm.trim().length > 1 
    ? relevantStudents.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.rut && s.rut.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 10)
    : [];

  const handleSelectStudent = (student) => {
    setEditingStudent(student);
    setFormData({
      rut: student.rut || '',
      name: student.name || '',
      grade: student.grade || '',
      branch: student.branch || '',
      institutionType: student.institutionType || '',
      jornada: student.jornada || ''
    });
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateStudent(editingStudent.id, formData);
      setMessage('Estudiante actualizado exitosamente.');
      setTimeout(() => {
        setMessage('');
        setEditingStudent(null);
      }, 2000);
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (!isOpen) return null;

  return (
    <BaseModal isOpen={isOpen} onClose={() => { setEditingStudent(null); setSearchTerm(''); onClose(); }} title="Editar Estudiante" icon={Edit2} maxWidth="600px">
      {message && (
        <div style={{ background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {!editingStudent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="search-bar glass-panel" style={{ margin: 0 }}>
            <Search className="search-icon" size={20} />
            <input
              type="text"
              placeholder="Buscar por Nombre o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {searchTerm.trim().length > 1 ? (
              filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <User size={24} color="var(--text-muted)" />
                      <div>
                        <div style={{ fontWeight: '600' }}>{student.name}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>RUT: {student.rut || 'N/A'} - {student.branch}</div>
                      </div>
                    </div>
                    <button onClick={() => handleSelectStudent(student)} className="btn-outline btn-outline-primary" style={{ padding: '0.5rem' }}>
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No se encontraron estudiantes.</p>
              )
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Escribe al menos 2 letras o números para buscar.</p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="create-user-form">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Editando a: {editingStudent.name}</h3>
            <button type="button" onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
          </div>
          
          <div className="form-group">
            <label>RUT</label>
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
            <label>Sede</label>
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
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={() => setEditingStudent(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Cancelar
            </button>
            <button type="submit" className="create-btn" style={{ flex: 1, justifyContent: 'center' }}>
              <Check size={18} style={{ marginRight: '0.5rem' }} /> Guardar
            </button>
          </div>
        </form>
      )}
    </BaseModal>
  );
};

export default SearchEditStudentModal;
