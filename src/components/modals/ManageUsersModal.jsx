import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Settings, Edit2, Trash2, Check, X, Globe2 } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { userService } from '../../services/userService';
import { NATIONAL_BRANCH } from '../../constants/branches';
import { ROLES, resolveBranchForRole } from '../../utils/permissions';

/**
 * ============================================================================
 * MODAL: ManageUsersModal (Gestión, Edición y Eliminación de Usuarios)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Se enfoca exclusivamente en listar, permitir edición en línea (inline) y
 *    eliminar cuentas de usuarios del sistema.
 * 2. DIP (Inversión de Dependencias):
 *    No ejecuta consultas Firestore directamente; delega a 'userService.updateSystemUser'
 *    y 'userService.deleteSystemUser'.
 * 3. Composición (OCP):
 *    Envuelto en <BaseModal> con título e icono personalizados sin alterar el código base.
 */
const ManageUsersModal = ({ 
  isOpen, 
  onClose, 
  staffList, 
  setStaffList, 
  roleOptions, 
  branchOptions 
}) => {
  // Estado para saber cuál usuario está en modo de edición en la lista
  const [editingSystemUserId, setEditingSystemUserId] = useState(null);
  const [editSystemUserForm, setEditSystemUserForm] = useState({ name: '', role: '', branch: '' });
  const [message, setMessage] = useState('');

  /**
   * Actualiza el usuario en la base de datos y en el estado local de React
   */
  const handleUpdateSystemUser = async (e, id) => {
    e.preventDefault();

    // El coordinador es nacional: la sede se fuerza a 'Todas las Sedes'.
    const isNationalRole = editSystemUserForm.role === ROLES.COORDINATOR;
    const assignedBranch = resolveBranchForRole(editSystemUserForm.role, editSystemUserForm.branch);

    if (!isNationalRole && editSystemUserForm.role !== ROLES.ADMIN && !assignedBranch) {
      setMessage('Debes asignar una sede a este usuario.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const payload = { ...editSystemUserForm, branch: assignedBranch };
      await userService.updateSystemUser(id, payload);
      // Actualización inmutable del estado
      setStaffList(staffList.map(s => s.id === id ? { ...s, ...payload } : s));
      setEditingSystemUserId(null);
      setMessage('Usuario actualizado correctamente.');
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

  /**
   * Elimina un usuario, protegiendo las cuentas con rol 'admin' por seguridad
   */
  const handleDeleteSystemUser = async (id, role) => {
    if (role === 'admin') {
      setMessage('No se puede eliminar a un administrador.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    if (window.confirm("¿Estás seguro de eliminar este usuario del sistema? No podrá volver a iniciar sesión.")) {
      try {
        await userService.deleteSystemUser(id);
        setStaffList(staffList.filter(s => s.id !== id));
        setMessage('Usuario eliminado del sistema.');
      } catch (err) {
        setMessage('Error al eliminar: ' + err.message);
      }
      setTimeout(() => setMessage(''), 3000);
    }
  };

  return (
    // BaseModal proporciona el diseño estándar de ventana modal con título e icono
    <BaseModal isOpen={isOpen} onClose={onClose} title="Gestión de Usuarios del Sistema" icon={Settings} maxWidth="800px">
      
      {/* Mensaje de retroalimentación (verde para éxito, visible durante 3 segundos) */}
      {message && (
        <div style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>
          {message}
        </div>
      )}
      
      {/* Lista scrolleable de usuarios del personal administrativo */}
      <div className="system-users-list">
        {staffList.map(staffUser => (
          <div key={staffUser.id} className="system-user-card" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            
            {/* CONDICIONAL: Si este usuario específico está en modo de edición en línea (inline edit) */}
            {editingSystemUserId === staffUser.id ? (
              // FORMULARIO DE EDICIÓN EN LÍNEA
              <form
                onSubmit={(e) => handleUpdateSystemUser(e, staffUser.id)}
                style={{
                  display: 'grid',
                  gap: '1rem',
                  gridTemplateColumns: editSystemUserForm.role === ROLES.COORDINATOR ? '1fr 1fr auto' : '1fr 1fr 1fr auto'
                }}
              >
                {/* Campo para editar el nombre */}
                <input 
                  type="text" 
                  value={editSystemUserForm.name} 
                  onChange={e => setEditSystemUserForm({...editSystemUserForm, name: e.target.value})} 
                  placeholder="Nombre"
                  required 
                  style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}
                />
                
                {/* Selector para cambiar el rol */}
                <CustomSelect 
                  value={editSystemUserForm.role} 
                  onChange={(val) => setEditSystemUserForm({
                    ...editSystemUserForm,
                    role: val,
                    // Al volver a coordinador se limpia la sede: su alcance es nacional.
                    branch: val === ROLES.COORDINATOR ? NATIONAL_BRANCH : editSystemUserForm.branch
                  })} 
                  options={roleOptions} 
                />

                {/* Selector de sede: el coordinador es nacional y no se le asigna sede */}
                {editSystemUserForm.role === ROLES.COORDINATOR ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      background: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                      fontWeight: '600',
                      fontSize: '0.9rem'
                    }}
                  >
                    <Globe2 size={16} />
                    Todas las Sedes (Nacional)
                  </div>
                ) : (
                  <CustomSelect 
                    value={editSystemUserForm.branch} 
                    onChange={(val) => setEditSystemUserForm({...editSystemUserForm, branch: val})} 
                    options={branchOptions} 
                  />
                )}

                {/* Botones de acción: Guardar (Check verde) o Cancelar (X roja) */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-outline btn-outline-green" style={{ padding: '0.5rem' }} title="Guardar cambios">
                    <Check size={18} />
                  </button>
                  <button type="button" className="btn-outline btn-outline-red" style={{ padding: '0.5rem' }} onClick={() => setEditingSystemUserId(null)} title="Cancelar">
                    <X size={18} />
                  </button>
                </div>
              </form>
            ) : (
              // VISTA DE LECTURA NORMAL DEL USUARIO
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{staffUser.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {staffUser.email} | <strong>Rol:</strong> {staffUser.role} | <strong>Sede:</strong> {staffUser.branch || 'Todas (Nacional)'}
                  </p>
                </div>

                {/* Botones de acción: Editar (Lápiz) y Eliminar (Papelera) */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    className="btn-outline" 
                    style={{ padding: '0.5rem' }} 
                    title="Editar datos del usuario"
                    onClick={() => {
                      setEditingSystemUserId(staffUser.id);
                      setEditSystemUserForm({ name: staffUser.name, role: staffUser.role, branch: staffUser.branch });
                    }}
                  >
                    <Edit2 size={16} />
                  </button>
                  
                  <button 
                    className="btn-outline btn-outline-red" 
                    style={{ padding: '0.5rem' }} 
                    title="Eliminar usuario"
                    onClick={() => handleDeleteSystemUser(staffUser.id, staffUser.role)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </BaseModal>
  );
};

export default ManageUsersModal;
