import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Users, Award, X, Trash2, UserPlus, Upload, Search } from 'lucide-react';
import { db } from '../firebase';
import { PINS_CATALOG } from './StudentProfile';
import { collection, getDocs } from 'firebase/firestore';
import './Dashboard.css';
import CustomSelect from '../components/CustomSelect';
import SidebarActions from '../components/SidebarActions';
import { excelService } from '../services/excelService';
import { validationService } from '../services/validationService';
import { branchOptions, ALL_BRANCHES } from '../constants/branches';
import { ROLES, isGlobalUser, isNationalScopeBranch } from '../utils/permissions';
import CreateUserModal from '../components/modals/CreateUserModal';
import ManageUsersModal from '../components/modals/ManageUsersModal';
import SearchEditStudentModal from '../components/modals/SearchEditStudentModal';
import { TEMPLATES } from '../constants/templates';

const roleOptions = [
  { value: ROLES.DIRECTOR, label: 'Director DAE' },
  { value: ROLES.ASSISTANT, label: 'Asistente DAE' },
  { value: ROLES.COORDINATOR, label: 'Coordinador (Nacional)' }
];

const Dashboard = () => {
  const { user } = useAuth();
  const { studentsList, addStudents, updateStudent, deleteStudent, deleteStudentsByBranch } = useData();
  
  const [newBranch, setNewBranch] = useState('Arica');
  const [message, setMessage] = useState('');
  
  const [staffList, setStaffList] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportStudentsModal, setShowImportStudentsModal] = useState(false);
  const [importBranch, setImportBranch] = useState('Auto');
  
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showSearchEditStudentModal, setShowSearchEditStudentModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [deleteSearchTerm, setDeleteSearchTerm] = useState('');
  const [isImportingPins, setIsImportingPins] = useState(false);

  const [newStudentRut, setNewStudentRut] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentGrade, setNewStudentGrade] = useState('');
  const [newStudentInstType, setNewStudentInstType] = useState('UST');

  const [showSystemUsersModal, setShowSystemUsersModal] = useState(false);

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
    if (isGlobalUser(user)) {
      fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.branch]);

  // Alcance del usuario: el coordinador es NACIONAL (ve todas las sedes),
  // igual que el admin. Se resuelve con el helper centralizado de permisos.
  const isGlobal = isGlobalUser(user);
  const displayBranch = isGlobal ? 'Todas las Sedes' : (user?.branch || 'Sin Sede');
  
  const relevantStudents = isGlobal 
    ? studentsList 
    : studentsList.filter(s => s.branch === user?.branch);
  
  const studentsCount = relevantStudents.length;
  const pinsCount = relevantStudents.reduce((acc, curr) => acc + (curr.collectedPins?.length || 0), 0);

  const branchBreakdown = isGlobal ? (() => {
    const breakdown = {};
    
    staffList.forEach(staff => {
      if (typeof staff.branch === 'string' && !isNationalScopeBranch(staff.branch)) {
        breakdown[staff.branch] = 0;
      }
    });

    studentsList.forEach(student => {
      const branch = student.branch || 'Sin Sede Asignada';
      if (!isNationalScopeBranch(branch)) {
        breakdown[branch] = (breakdown[branch] || 0) + 1;
      }
    });

    return breakdown;
  })() : {};



  /**
   * 1. Ingesta de Estudiantes desde archivo Excel con Validaciones Previas
   */
  const handleImportStudents = async (e) => {
    e.preventDefault();
    setMessage('');
    const fileInput = document.getElementById('student-file-input');
    const file = fileInput?.files[0];
    
    // Validación previa de archivo
    const fileValidation = validationService.validateExcelFile(file);
    if (!fileValidation.isValid) {
      setMessage(`Error en archivo: ${fileValidation.error}`);
      return;
    }

    try {
      // 1. Lectura segura desacoplada en excelService
      const rawRows = await excelService.parseExcelFile(file);

      // 2. Validación de columnas y consistencia de datos
      const structureValidation = validationService.validateExcelStudentsStructure(rawRows, importBranch);
      if (!structureValidation.isValid) {
        setMessage(`Error en formato de datos: ${structureValidation.error}`);
        return;
      }

      // 3. Preparación de los estudiantes validados
      const newStudents = structureValidation.validRows.map((row, index) => ({
        ...row,
        avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(row.name || index)}&backgroundColor=e6f2ec`,
        collectedPins: [], 
        availablePins: [],
        journeyEvents: [
          { date: new Date().toISOString(), title: 'Ingreso al Sistema', description: 'Registro creado mediante importación masiva.' }
        ]
      }));

      // 4. Ingesta en Firestore
      await addStudents(newStudents);
      
      let msg = `¡Éxito! Se importaron ${newStudents.length} estudiantes correctamente ${importBranch === 'Auto' ? 'con detección automática de sede' : `a la sede ${importBranch}`}.`;
      if (structureValidation.invalidCount > 0) {
        msg += ` (${structureValidation.invalidCount} filas incompletas omitidas).`;
      }
      if (structureValidation.rutsWithFormatWarning > 0) {
        msg += ` Nota: ${structureValidation.rutsWithFormatWarning} estudiantes tienen formato de RUT no estándar.`;
      }

      setMessage(msg);
      setShowImportStudentsModal(false);
      setTimeout(() => setMessage(''), 6000);
    } catch (error) {
      setMessage(`Error al procesar archivo: ${error.message}`);
      setTimeout(() => setMessage(''), 6000);
    }
  };

  /**
   * 2. Ingesta y Asignación de Pines desde Excel con Validación
   */
  const handleImportPins = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de archivo
    const fileValidation = validationService.validateExcelFile(file);
    if (!fileValidation.isValid) {
      setMessage(`Error en archivo de pines: ${fileValidation.error}`);
      setTimeout(() => setMessage(''), 5000);
      e.target.value = null;
      return;
    }

    setIsImportingPins(true);
    setMessage('');

    try {
      const data = await excelService.parseExcelFile(file);

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("El archivo de pines está vacío o no contiene filas con datos.");
      }

      // Verificación de existencia de columna RUT
      const firstRow = data[0];
      const hasRutCol = Object.keys(firstRow).some(k => 
        ['rut', 'id', 'identificacion', 'cedula'].some(p => 
          k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase()
        )
      );

      if (!hasRutCol) {
        throw new Error("El archivo no contiene la columna obligatoria 'RUT' para asociar los pines a los alumnos.");
      }

      let updateCount = 0;

      for (const row of data) {
        const getVal = (possibleNames) => {
          const key = Object.keys(row).find(k => 
            possibleNames.some(p => k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === p.toLowerCase())
          );
          return key ? row[key] : undefined;
        };

        const rowRut = String(getVal(['rut', 'id', 'identificacion', 'cedula']) || '').trim();
        if (!rowRut) continue;

        const cleanRowRut = validationService.cleanRut(rowRut);

        // Busca al estudiante por su RUT limpio
        const existingStudent = studentsList.find(s => {
          const dbRut = validationService.cleanRut(s.rut || s.id);
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

      setMessage(`¡Proceso completado! Se actualizaron los pines de ${updateCount} estudiantes.`);
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error("Error importando pines:", error);
      setMessage(`Error al procesar archivo de pines: ${error.message}`);
      setTimeout(() => setMessage(''), 6000);
    } finally {
      setIsImportingPins(false);
      e.target.value = null;
    }
  };

  /**
   * 3. Exportación a Excel mediante excelService
   */
  const handleExportExcel = () => {
    const studentsToExport = isGlobal ? studentsList : studentsList.filter(s => s.branch === user.branch);
    if (!studentsToExport || studentsToExport.length === 0) {
      setMessage('No hay estudiantes disponibles para exportar.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    excelService.exportToExcel(studentsToExport, `Estudiantes_${isGlobal ? 'Nacional' : user.branch}.xlsx`);
    setMessage('¡Descarga de Excel generada exitosamente!');
    setTimeout(() => setMessage(''), 4000);
  };

  /**
   * 4. Registro Manual de Estudiante con Validaciones de Obligatoriedad y RUT
   */
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setMessage('');

    // Validación 1: Campos obligatorios
    if (!newStudentName.trim()) {
      setMessage('Error: El nombre del estudiante es obligatorio.');
      return;
    }
    if (!newStudentGrade.trim()) {
      setMessage('Error: La carrera o programa es obligatorio.');
      return;
    }

    // Validación 2: Formato de RUT
    let finalRut = newStudentRut.trim();
    let finalId = `manual-${Date.now()}`;

    if (finalRut) {
      const rutValidation = validationService.validateRut(finalRut);
      if (!rutValidation.isValid) {
        setMessage(`Error en RUT: ${rutValidation.error}`);
        return;
      }
      finalRut = rutValidation.formatted;
      finalId = rutValidation.cleaned;
    } else {
      setMessage('Error: El RUT del estudiante es obligatorio.');
      return;
    }

    const assignedBranch = isGlobal ? newBranch : user.branch;
    if (!assignedBranch) {
      setMessage('Error: Debes asignar una sede al estudiante.');
      return;
    }

    const newStudent = {
      id: finalId,
      rut: finalRut,
      name: newStudentName.trim(),
      avatar: `https://api.dicebear.com/7.x/micah/svg?seed=${encodeURIComponent(newStudentName)}&backgroundColor=e6f2ec`,
      grade: newStudentGrade.trim(),
      jornada: '',
      branch: assignedBranch,
      institutionType: newStudentInstType,
      bio: 'Estudiante Tomasino',
      collectedPins: [], 
      availablePins: [],
      journeyEvents: [
        { date: new Date().toISOString(), title: 'Ingreso Manual', description: 'Registro creado manualmente en el sistema.' }
      ]
    };

    await addStudents([newStudent]);
    setMessage('¡Estudiante agregado exitosamente!');
    setShowAddStudentModal(false);
    setNewStudentRut('');
    setNewStudentName('');
    setNewStudentGrade('');
    setTimeout(() => setMessage(''), 4000);
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
          <p className="page-subtitle" style={{ margin: 0 }}>Bienvenido, {user.name || user.email} ({displayBranch})</p>
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
          onSearchEditStudent={() => setShowSearchEditStudentModal(true)}
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

            {user?.role !== ROLES.ASSISTANT && (
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
                  options={[{ value: 'Auto', label: 'Automático (Detectar en Excel)' }, ...branchOptions]} 
                  placeholder="Seleccionar Sede Destino" 
                />
              </div>

              <div className="form-group">
                <label>Archivo Excel</label>
                <input type="file" id="student-file-input" accept=".xlsx, .xls, .csv" required style={{ border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '0.5rem', width: '100%' }} />
                {/* 📌 Acceso rápido a la plantilla oficial sin salir del modal */}
                <a
                  href={TEMPLATES.find((t) => t.id === 'students')?.url}
                  download="Plantilla_Estudiantes.xlsx"
                  className="modal-template-link"
                >
                  ¿No tienes el formato? Descargar plantilla de estudiantes
                </a>
              </div>
              
              <button type="submit" className="create-btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Procesar Archivo</button>
            </form>
          </div>
        </div>
      )}

      {showCreateModal && isGlobal && (
        <CreateUserModal 
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchStaff}
          roleOptions={roleOptions}
          branchOptions={branchOptions}
        />
      )}

      {showSystemUsersModal && isGlobal && (
        <ManageUsersModal 
          isOpen={showSystemUsersModal}
          onClose={() => setShowSystemUsersModal(false)}
          staffList={staffList}
          setStaffList={setStaffList}
          roleOptions={roleOptions}
          branchOptions={branchOptions}
        />
      )}

      {showSearchEditStudentModal && isGlobal && (
        <SearchEditStudentModal 
          isOpen={showSearchEditStudentModal}
          onClose={() => setShowSearchEditStudentModal(false)}
          user={user}
        />
      )}

      {showAddStudentModal && user?.role !== ROLES.ASSISTANT && (
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
                <label translate="no">RUT (opcional)</label>
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
                    {ALL_BRANCHES.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              )}
              <button type="submit" className="create-btn" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Agregar Estudiante</button>
            </form>
          </div>
        </div>
      )}

      {showDeleteStudentModal && user?.role !== ROLES.ASSISTANT && (
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
