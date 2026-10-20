import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Search, Edit2, Check, X, User, Loader2, ArrowRight } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { useData } from '../../context/DataContext';
import { validationService } from '../../services/validationService';


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

/**
 * ============================================================================
 * MODAL: SearchEditStudentModal (Búsqueda y Edición de Estudiantes)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Gestiona el flujo interactivo de: buscar un estudiante por nombre/RUT y,
 *    al seleccionarlo, desplegar el formulario de edición con guardado asíncrono.
 * 2. DIP (Inversión de Dependencias):
 *    Consume `useData()` para acceder a la lista y función de actualización,
 *    sin depender de la implementación concreta de Firestore.
 * 3. Composición (OCP):
 *    Aprovecha `BaseModal` para la experiencia de ventana emergente y cierre.
 */
const SearchEditStudentModal = ({ isOpen, onClose, user }) => {
  // 1. Inversión de Dependencias (DIP): Obtenemos lista y método de actualización desde DataContext
  const { studentsList, updateStudent } = useData();
  
  // Estados para búsqueda, estudiante seleccionado y datos del formulario
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // 2. Control de Acceso por Sede:
  // Si el usuario es administrador global (admin), puede ver y editar a cualquier alumno del país.
  // Si es un coordinador de sede, solo puede ver y editar a los alumnos pertenecientes a su sede.
  const isGlobal = user?.role === 'admin';
  const relevantStudents = isGlobal 
    ? studentsList 
    : studentsList.filter(s => s.branch === user?.branch);

  // 3. Filtro en Tiempo Real:
  // Si el usuario escribe al menos 2 caracteres, busca coincidencias en nombre o RUT (máximo 10 resultados).
  const filteredStudents = searchTerm.trim().length > 1 
    ? relevantStudents.filter(s => 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.rut && s.rut.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 10)
    : [];

  // 4. Selecciona un estudiante para abrir su formulario de edición
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
    setSearchTerm(''); // Limpia el término de búsqueda
  };

  // 5. Envía los datos actualizados a Firestore con validaciones previas
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validación de obligatoriedad
    if (!formData.name || !formData.name.trim()) {
      setMessage('Error: El nombre completo del estudiante es obligatorio.');
      return;
    }
    if (!formData.grade || !formData.grade.trim()) {
      setMessage('Error: La carrera o programa es obligatorio.');
      return;
    }

    // Validación de RUT (si se ingresó)
    if (formData.rut && formData.rut.trim()) {
      const rutVal = validationService.validateRut(formData.rut);
      if (!rutVal.isValid) {
        setMessage(`Error en RUT: ${rutVal.error}`);
        return;
      }
      formData.rut = rutVal.formatted;
    }

    setIsSaving(true);
    try {
      await updateStudent(editingStudent.id, formData);
      setMessage('Estudiante actualizado exitosamente.');
      setTimeout(() => {
        setMessage('');
        setEditingStudent(null);
        setIsSaving(false);
      }, 1500);
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
      setIsSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };


  // Si el modal está cerrado, no renderiza nada en el DOM
  if (!isOpen) return null;

  return (
    // Cascarón BaseModal con título e icono
    <BaseModal 
      isOpen={isOpen} 
      onClose={() => { setEditingStudent(null); setSearchTerm(''); onClose(); }} 
      title="Editar Estudiante" 
      icon={Edit2} 
      maxWidth="600px"
    >
      {/* Alerta de confirmación de éxito o error */}
      {message && (
        <div style={{ background: message.includes('Error') ? '#fee2e2' : '#dcfce7', color: message.includes('Error') ? '#991b1b' : '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}

      {/* VISTA 1: BÚSQUEDA DEL ESTUDIANTE (Si aún no se ha seleccionado a nadie) */}
      {!editingStudent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Barra de búsqueda interactiva */}
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
          
          {/* Lista de resultados encontrados */}
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
                    {/* Botón para seleccionar y editar este alumno */}
                    <button onClick={() => handleSelectStudent(student)} className="btn-outline btn-outline-primary" style={{ padding: '0.5rem' }} title="Editar este estudiante">
                      <Edit2 size={16} />
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>No se encontraron estudiantes con ese criterio.</p>
              )
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem' }}>Escribe al menos 2 letras o números para buscar.</p>
            )}
          </div>
        </div>
      ) : (
        // VISTA 2: GUARDANDO O EDITANDO
        isSaving ? (
          // Animación visual de guardado / transferencia
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', textAlign: 'center', gap: '1.5rem' }}>
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
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Actualizando datos de {editingStudent.name}</p>
          </div>
        ) : (
          // FORMULARIO CON LOS DATOS DEL ESTUDIANTE SELECCIONADO
          <form onSubmit={handleSubmit} className="create-user-form">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Editando a: {editingStudent.name}</h3>
              {/* Botón para volver atrás a la lista de búsqueda */}
              <button type="button" onClick={() => setEditingStudent(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Volver a la búsqueda">
                <X size={20} />
              </button>
            </div>
            
            {/* Campo RUT y Nombre */}
            <div className="form-row">
              <div className="form-group">
                <label translate="no">RUT (opcional)</label>
                <input type="text" value={formData.rut} onChange={e => setFormData({...formData, rut: e.target.value})} placeholder="Ej: 12345678-9" />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
            </div>

            {/* Carrera y Sede */}
            <div className="form-row">
              <div className="form-group">
                <label>Carrera / Programa</label>
                <input type="text" value={formData.grade} onChange={e => setFormData({...formData, grade: e.target.value})} required />
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
            </div>
            
            {/* Tipo de Institución (UST, IP o CFT) */}
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

            {/* Botones de acción: Cancelar o Guardar */}
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setEditingStudent(null)} className="btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
              <button type="submit" className="create-btn" style={{ flex: 1, justifyContent: 'center', marginTop: 0 }}>
                <Check size={18} style={{ marginRight: '0.5rem' }} /> Guardar
              </button>
            </div>
          </form>
        )
      )}
    </BaseModal>
  );
};

export default SearchEditStudentModal;
