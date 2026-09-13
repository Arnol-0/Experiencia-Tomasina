import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Users, Award, ShieldPlus, X, Trash2, UserPlus, Upload, Search, Download, Settings, Edit2, Check, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db, firebaseConfig } from '../firebase';
import { initializeApp } from 'firebase/app';
import { PINS_CATALOG } from './StudentProfile';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, collection, getDocs, deleteDoc, updateDoc } from 'firebase/firestore';
import './Dashboard.css';
import CustomSelect from '../components/CustomSelect';
import SidebarActions from '../components/SidebarActions';
import { excelService } from '../services/excelService';
import CreateUserModal from '../components/modals/CreateUserModal';
import ManageUsersModal from '../components/modals/ManageUsersModal';

const branchOptions = [
  {
    label: 'Zona Norte',
    options: ['Arica', 'Iquique', 'Antofagasta', 'Copiapó']
  },
  {
    label: 'Zona Centro',
    options: ['La Serena', 'Ovalle', 'Viña del Mar', 'Rancagua', 'Curicó', 'Talca']
  },
  {
    label: 'Región Metropolitana',
    options: ['UST Santiago (Av. Ejército Libertador)', 'Santiago Centro (Vergara)', 'San Joaquín', 'Puente Alto']
  },
  {
    label: 'Zona Sur y Austral',
    options: ['Chillán', 'Concepción', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 'Puerto Montt', 'Punta Arenas']
  },
  {
    label: 'Modalidad Virtual',
    options: ['Sede Online']
  }
];

const roleOptions = [
  { value: 'director_dae', label: 'Director DAE' },
  { value: 'asistente_dae', label: 'Asistente DAE' },
  { value: 'coordinador', label: 'Coordinador' }
];

const editRoleOptions = [
  { value: 'director_dae', label: 'Director DAE' },
  { value: 'asistente_dae', label: 'Asistente DAE' },
  { value: 'coordinador', label: 'Coordinador' },
  { value: 'admin', label: 'Admin' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { studentsList, addStudents, updateStudent, deleteStudent, deleteStudentsByBranch } = useData();
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('asistente_dae');
  const [newBranch, setNewBranch] = useState('Arica');
  const [message, setMessage] = useState('');
  
  const [staffList, setStaffList] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);
  const [importBranch, setImportBranch] = useState('Arica');
  
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [deleteSearchTerm, setDeleteSearchTerm] = useState('');
  const [isImportingPins, setIsImportingPins] = useState(false);

  const [newStudentRut, setNewStudentRut] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentInstType, setNewStudentInstType] = useState('UST');

  const [showSystemUsersModal, setShowSystemUsersModal] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('estudiantes');

  const fetchStaff = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const staff = [];
      querySnapshot.forEach(docSnap => {
        staff.push({ id: docSnap.id, ...docSnap.data() });
      });
      setStaffList(staff);
    } catch (err) {
      console.error("Error fetching staff:", err);
    }
  };

  React.useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'coordinador') {
      fetchStaff();
    }
  }, [user?.role]);

  const handleDeleteSystemUser = async (userId) => {
    if (!window.confirm("¿Estás seguro de eliminar el perfil de este usuario? Perderá acceso al sistema.")) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      setStaffList(prev => prev.filter(u => u.id !== userId));
      setMessage("Usuario del sistema eliminado correctamente.");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      setMessage("Error al eliminar el usuario.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleSaveSystemUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        name: editSystemUserForm.name,
        role: editSystemUserForm.role,
        branch: editSystemUserForm.branch
      });
      setStaffList(prev => prev.map(u => u.id === userId ? { ...u, ...editSystemUserForm } : u));
      setEditingSystemUserId(null);
      setMessage("Usuario del sistema actualizado correctamente.");
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error("Error al actualizar usuario:", error);
      setMessage("Error al actualizar el usuario.");
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const isGlobal = user?.role === 'admin' || user?.role === 'coordinador';
  const displayBranch = isGlobal ? 'Todas las Sedes' : (user?.branch || 'Sin Sede');
  
  const relevantStudents = isGlobal 
    ? studentsList 
    : studentsList.filter(s => s.branch === user?.branch);
  
  const studentsCount = relevantStudents.length;
  const pinsCount = relevantStudents.reduce((acc, curr) => acc + (curr.collectedPins?.length || 0), 0);

  const branchBreakdown = isGlobal ? (() => {
    const breakdown = {};
    
    staffList.forEach(staff => {
      if (typeof staff.branch === 'string' && staff.branch.toLowerCase() !== 'todas' && staff.branch.toLowerCase() !== 'todas las sedes') {
        breakdown[staff.branch] = 0;
      }
    });

    studentsList.forEach(student => {
      const branch = student.branch || 'Sin Sede Asignada';
      if (branch.toLowerCase() !== 'todas' && branch.toLowerCase() !== 'todas las sedes') {
        breakdown[branch] = (breakdown[branch] || 0) + 1;
      }
    });

    return breakdown;
  })() : {};



  const handleImportStudents = (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('student-file-input');
    const file = fileInput?.files[0];
    if (!file) {
      setMessage('Por favor, selecciona un archivo Excel.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      const newStudents = data.map((row, index) => {
        const getVal = (possibleNames) => {
          const key = Object.keys(row).find(k => 
            possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
          );
          return key ? row[key] : undefined;
        };

        const rowRut = getVal(['rut', 'id', 'identificacion']);
        const rowName = getVal(['nombre', 'nombres', 'estudiante', 'alumno']);
        const rowGrade = getVal(['carrera', 'programa']);
        const rowJornada = getVal(['jornada', 'turno']);
        const rowInstitution = getVal(['institucion', 'institución', 'tipo']);

        return {
          id: rowRut ? String(rowRut).trim() : `imported-${Date.now()}-${index}`,
          rut: rowRut ? String(rowRut).trim() : '',
          name: rowName || 'Sin Nombre',
          avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${rowName || index}&backgroundColor=e6f2ec`,
          grade: rowGrade ? String(rowGrade).trim() : 'Sin carrera',
          jornada: rowJornada ? String(rowJornada).trim() : '',
          branch: importBranch,
          institutionType: rowInstitution ? String(rowInstitution).trim() : '',
          bio: 'Estudiante Tomasino',
          collectedPins: [], 
          availablePins: [],
          journeyEvents: [
            { date: new Date().toISOString(), title: 'Ingreso al Sistema', description: 'Registro creado mediante importación.' }
          ]
        };
      });

      addStudents(newStudents);
      setMessage(`Se importaron ${newStudents.length} estudiantes a la sede ${importBranch}.`);
      setShowImportStudentsModal(false);
      setTimeout(() => setMessage(''), 5000);
    };
    reader.readAsBinaryString(file);
  };

  const handleImportPins = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsImportingPins(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      let updateCount = 0;

      for (const row of data) {
        const getVal = (possibleNames) => {
          const key = Object.keys(row).find(k => 
            possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
          );
          return key ? row[key] : undefined;
        };

        const rowRut = String(getVal(['rut', 'id', 'identificacion']) || '').trim();
        if (!rowRut) continue;

        const cleanRowRut = rowRut.replace(/[^0-9kK]/g, '').toLowerCase();

        const existingStudent = studentsList.find(s => {
          const dbRut = String(s.rut || s.id || '').replace(/[^0-9kK]/g, '').toLowerCase();
          return dbRut === cleanRowRut;
        });
        
        if (!existingStudent) continue; 

        const newAvailablePins = [...(existingStudent.availablePins || [])];
        let changed = false;

        const pinesDisponiblesStr = getVal(['pines disponibles', 'pines activos', 'disponibles', 'pin', 'pines']);
        if (pinesDisponiblesStr) {
          const str = String(pinesDisponiblesStr).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          PINS_CATALOG.forEach(pin => {
            const cleanName = pin.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            if ((str.includes(cleanName) || str.includes(pin.id.toLowerCase())) && !newAvailablePins.includes(pin.id)) {
              newAvailablePins.push(pin.id);
              changed = true;
            }
          });
        }
        
        PINS_CATALOG.forEach(pin => {
          const val = getVal([pin.name, pin.id]);
          if (val && String(val).trim().match(/^(si|sí|x|1|ok|true|yes)$/i)) {
             if (!newAvailablePins.includes(pin.id)) {
               newAvailablePins.push(pin.id);
               changed = true;
             }
          }
        });

        if (changed) {
          await updateStudent(existingStudent.id, { availablePins: newAvailablePins });
          updateCount++;
        }
      }

      setMessage(`Se actualizaron pines para ${updateCount} estudiantes.`);
      setTimeout(() => setMessage(''), 5000);
      } catch (error) {
        console.error("Error importando pines:", error);
        setMessage("Hubo un error al procesar el Excel.");
        setTimeout(() => setMessage(''), 5000);
      } finally {
        setIsImportingPins(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = null;
  };

  const handleExportExcel = () => {
    setTimeout(() => setMessage(''), 3000);
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();
    const id = newStudentRut ? String(newStudentRut).trim() : `manual-${Date.now()}`;
    const newStudent = {
      id,
      rut: newStudentRut,
      name: newStudentName || 'Sin Nombre',
      avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${newStudentName || 'manual'}&backgroundColor=e6f2ec`,
      grade: newStudentGrade || 'Sin carrera',
      jornada: '',
      branch: isGlobal ? newBranch : user.branch,
      institutionType: newStudentInstType,
      bio: 'Estudiante Tomasino',
      collectedPins: [], 
      availablePins: [],
      journeyEvents: [
        { date: new Date().toISOString(), title: 'Ingreso Manual', description: 'Registro creado manualmente en el sistema.' }
      ]
    };
    await addStudents([newStudent]);
    setMessage('Estudiante agregado exitosamente.');
    setShowAddStudentModal(false);
    setNewStudentRut('');
    setNewStudentName('');
    setNewStudentGrade('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteStudent = async (studentId) => {
    if (window.confirm("¿Estás seguro de eliminar este estudiante? Esta acción es irreversible.")) {
      await deleteStudent(studentId);
      setMessage('Estudiante eliminado.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDeleteBranchStudents = async () => {
    if (window.confirm(`¿Seguro que deseas vaciar la lista de ESTUDIANTES de la sede ${selectedBranch}? \n\nNOTA: Esto solo eliminará a los estudiantes. La sede y sus funcionarios (Directores/Asistentes) NO serán eliminados.`)) {
      await deleteStudentsByBranch(selectedBranch);
      setMessage(`Se han eliminado todos los estudiantes de la sede ${selectedBranch}.`);
      setSelectedBranch(null);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const deleteFilteredStudents = relevantStudents.filter(student =>
    (student.name || '').toLowerCase().includes(deleteSearchTerm.toLowerCase()) ||
    (student.rut && student.rut.toLowerCase().includes(deleteSearchTerm.toLowerCase()))
  );

  return (
    <div className="dashboard-page container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Panel de Control</h1>
          <p className="page-subtitle" style={{ margin: 0 }}>Bienvenido, {user.name} ({displayBranch})</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper"><Users className="stat-icon" size={28} /></div>
          <div className="stat-content">
            <h3>Estudiantes</h3>
            <span className="stat-number text-gradient">{studentsCount}</span>
            <span className="stat-desc">En {displayBranch}</span>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon-wrapper"><Award className="stat-icon" size={28} /></div>
          <div className="stat-content">
            <h3>Pines Entregados</h3>
            <span className="stat-number text-gradient">{pinsCount}</span>
            <span className="stat-desc">En {displayBranch}</span>
          </div>
        </div>
      </div>

      {message && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem', textAlign: 'center', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      <div className="dashboard-main-grid">
        <SidebarActions 
          user={user}
          isGlobal={isGlobal}
          onAddStudent={() => setShowAddStudentModal(true)}
          onImportStudents={() => setShowImportStudentsModal(true)}
          onExportExcel={handleExportExcel}
          onDeleteStudent={() => setShowDeleteStudentModal(true)}
          onImportPins={handleImportPins}
          onCreateUser={() => setShowCreateModal(true)}
          onManageUsers={() => { fetchStaff(); setShowSystemUsersModal(true); }}
        />

        <div className="admin-content">
          {isGlobal && Object.keys(branchBreakdown).length > 0 && (
            <div className="branch-breakdown glass-panel">
              <div className="section-header branch-header">
                <Users size={24} className="branch-icon" />
                <h2>Estudiantes por Sede</h2>
              </div>
              <div className="branch-grid">
                {Object.entries(branchBreakdown).sort((a, b) => b[1] - a[1]).map(([branch, count]) => (
                  <div key={branch} className="branch-card clickable" onClick={() => setSelectedBranch(branch)}>
                    <span className="branch-name">{branch}</span>
                    <span className="branch-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedBranch && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-content animate-fade-in">
            <button className="dashboard-modal-close" onClick={() => setSelectedBranch(null)}>
              <X size={24} />
            </button>
            <h2 className="modal-title text-gradient">Detalles de Sede: {selectedBranch}</h2>
            
            <div className="modal-stats-row">
              <div className="modal-stat-box">
                <Users size={20} className="modal-stat-icon" />
                <div className="modal-stat-info">
                  <span className="modal-stat-label">Estudiantes</span>
                  <span className="modal-stat-value">{studentsList.filter(s => s.branch === selectedBranch).length}</span>
                </div>
              </div>
              <div className="modal-stat-box">
                <Award size={20} className="modal-stat-icon" />
                <div className="modal-stat-info">
                  <span className="modal-stat-label">Pines Entregados</span>
                  <span className="modal-stat-value">
                    {studentsList.filter(s => s.branch === selectedBranch).reduce((acc, curr) => acc + (curr.collectedPins ? curr.collectedPins.length : 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="staff-section">
              <div className="staff-group">
                <h3>Director DAE</h3>
                {staffList.filter(s => s.branch === selectedBranch && s.role === 'director_dae').length > 0 ? (
                  <ul className="staff-list">
                    {staffList.filter(s => s.branch === selectedBranch && s.role === 'director_dae').map(staff => (
                      <li key={staff.id} className="staff-item">
                        <span className="staff-name">{staff.name}</span>
                        <span className="staff-email">{staff.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-staff">No hay Director DAE asignado</p>
                )}
              </div>

              <div className="staff-group">
                <h3>Asistentes DAE</h3>
                {staffList.filter(s => s.branch === selectedBranch && s.role === 'asistente_dae').length > 0 ? (
                  <ul className="staff-list">
                    {staffList.filter(s => s.branch === selectedBranch && s.role === 'asistente_dae').map(staff => (
                      <li key={staff.id} className="staff-item">
                        <span className="staff-name">{staff.name}</span>
                        <span className="staff-email">{staff.email}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-staff">No hay Asistentes DAE asignados</p>
                )}
              </div>
            </div>

            {user.role !== 'asistente_dae' && (
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={handleDeleteBranchStudents}
                  className="create-btn" 
                  style={{ background: '#ef4444', borderColor: '#ef4444', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', justifyContent: 'center' }}
                >
                  <Trash2 size={20} />
                  ELIMINAR ESTUDIANTES DE ESTA SEDE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showImportStudentsModal && isGlobal && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <button className="dashboard-modal-close" onClick={() => setShowImportStudentsModal(false)}>
              <X size={24} />
            </button>
            <div className="section-header">
              <Upload size={24} color="var(--color-primary)" />
              <h2>Importar Estudiantes</h2>
            </div>
            
            <form onSubmit={handleImportStudents} className="create-user-form">
              <div className="form-group">
                <label>Sede Destino</label>
                <CustomSelect 
                  value={importBranch} 
                  onChange={setImportBranch} 
                  options={branchOptions} 
                  placeholder="Seleccionar Sede Destino" 
                />
              </div>

              <div className="form-group">
                <label>Archivo Excel</label>
                <input type="file" id="student-file-input" accept=".xlsx, .xls, .csv" required style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', width: '100%' }} />
              </div>
              
              <button type="submit" className="create-btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Procesar Archivo</button>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && user?.role === 'admin' && (
        <CreateUserModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          roleOptions={roleOptions}
          branchOptions={branchOptions}
        />
      )}

      {showSystemUsersModal && user?.role === 'admin' && (
        <ManageUsersModal 
          isOpen={showSystemUsersModal}
          onClose={() => setShowSystemUsersModal(false)}
          staffList={staffList}
          setStaffList={setStaffList}
          roleOptions={roleOptions}
          branchOptions={branchOptions}
        />
      )}

      {showAddStudentModal && user?.role !== 'asistente_dae' && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <button className="dashboard-modal-close" onClick={() => setShowAddStudentModal(false)}>
              <X size={24} />
            </button>
            <div className="section-header">
              <UserPlus size={24} color="var(--color-primary)" />
              <h2>Agregar Estudiante</h2>
            </div>
            
            <form onSubmit={handleAddStudent} className="create-user-form">
              <div className="form-group">
                <label>RUT (opcional)</label>
                <input type="text" value={newStudentRut} onChange={e=>setNewStudentRut(e.target.value)} placeholder="Ej: 12345678-9" />
              </div>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" value={newStudentName} onChange={e=>setNewStudentName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Carrera / Grado</label>
                <input type="text" value={newStudentGrade} onChange={e=>setNewStudentGrade(e.target.value)} required placeholder="Ej: Ingeniería Informática Diurna" />
              </div>
              <div className="form-group">
                <label>Tipo de Institución</label>
                <select value={newStudentInstType} onChange={e=>setNewStudentInstType(e.target.value)} required>
                  <option value="UST">UST (Universidad Santo Tomás)</option>
                  <option value="IPST">IPST (Instituto Profesional)</option>
                  <option value="CFTST">CFTST (Centro de Formación Técnica)</option>
                </select>
              </div>
              
              {isGlobal && (
                <div className="form-group">
                  <label>Sede</label>
                  <select value={newBranch} onChange={e=>setNewBranch(e.target.value)}>
                    <option value="Arica">Arica</option>
                    <option value="Iquique">Iquique</option>
                    <option value="Santiago Centro (Vergara)">Santiago Centro (Vergara)</option>
                    <option value="Viña del Mar">Viña del Mar</option>
                  </select>
                </div>
              )}
              <button type="submit" className="create-btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Agregar Estudiante</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteStudentModal && user.role !== 'asistente_dae' && (
        <div className="dashboard-modal-overlay">
          <div className="dashboard-modal-content animate-fade-in" style={{ maxWidth: '600px', padding: '2rem' }}>
            <button className="dashboard-modal-close" onClick={() => setShowDeleteStudentModal(false)}>
              <X size={24} />
            </button>
            <div className="section-header">
              <Trash2 size={24} color="#ef4444" />
              <h2 style={{ color: '#ef4444' }}>Eliminar Estudiante</h2>
            </div>
            
            <div className="search-bar glass-panel" style={{ marginBottom: '1.5rem', background: 'var(--color-bg)' }}>
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Buscar por nombre o RUT..."
                value={deleteSearchTerm}
                onChange={(e) => setDeleteSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="delete-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {deleteFilteredStudents.slice(0, 50).map(student => (
                <div key={student.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{student.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{student.rut || student.id} - {student.branch}</div>
                  </div>
                  <button 
                    onClick={() => handleDeleteStudent(student.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                    title="Eliminar"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {deleteFilteredStudents.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron estudiantes.</p>}
              {deleteFilteredStudents.length > 50 && <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '1rem' }}>Mostrando los primeros 50 resultados. Refina tu búsqueda.</p>}
            </div>
          </div>
        </div>
      )}



      {isImportingPins && (
        <div className="dashboard-modal-overlay loading-overlay">
          <div className="loading-spinner-container">
            <div className="spinner"></div>
            <h3>Procesando Pines...</h3>
            <p>Por favor, no cierres esta ventana.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
