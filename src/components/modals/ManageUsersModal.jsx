import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { Settings, Edit2, Trash2, Check, X } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { userService } from '../../services/userService';

const ManageUsersModal = ({ 
  isOpen, 
  onClose, 
  staffList, 
  setStaffList, 
  roleOptions, 
  branchOptions 
}) => {
  const [editingSystemUserId, setEditingSystemUserId] = useState(null);
  const [editSystemUserForm, setEditSystemUserForm] = useState({ name: '', role: '', branch: '' });
  const [message, setMessage] = useState('');

  const handleUpdateSystemUser = async (e, id) => {
    e.preventDefault();
    try {
      await userService.updateSystemUser(id, editSystemUserForm);
      setStaffList(staffList.map(s => s.id === id ? { ...s, ...editSystemUserForm } : s));
      setEditingSystemUserId(null);
      setMessage('Usuario actualizado correctamente.');
    } catch (err) {
      setMessage('Error al actualizar: ' + err.message);
    }
    setTimeout(() => setMessage(''), 3000);
  };

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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Gestión de Usuarios del Sistema" icon={Settings} maxWidth="800px">
      {message && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.5rem', borderRadius: '0.5rem', marginBottom: '1rem', textAlign: 'center' }}>{message}</div>}
      
      <div className="system-users-list">
        {staffList.map(staffUser => (
          <div key={staffUser.id} className="system-user-card" style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
            {editingSystemUserId === staffUser.id ? (
              <form onSubmit={(e) => handleUpdateSystemUser(e, staffUser.id)} style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr 1fr auto' }}>
                <input type="text" value={editSystemUserForm.name} onChange={e=>setEditSystemUserForm({...editSystemUserForm, name: e.target.value})} required style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '0.25rem' }}/>
                <CustomSelect 
                  value={editSystemUserForm.role} 
                  onChange={(val) => setEditSystemUserForm({...editSystemUserForm, role: val})} 
                  options={roleOptions} 
                />
                <CustomSelect 
                  value={editSystemUserForm.branch} 
                  onChange={(val) => setEditSystemUserForm({...editSystemUserForm, branch: val})} 
                  options={branchOptions} 
                />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn-outline btn-outline-green" style={{ padding: '0.5rem' }}><Check size={18} /></button>
                  <button type="button" className="btn-outline btn-outline-red" style={{ padding: '0.5rem' }} onClick={() => setEditingSystemUserId(null)}><X size={18} /></button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0' }}>{staffUser.name}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>{staffUser.email} | <strong>Rol:</strong> {staffUser.role} | <strong>Sede:</strong> {staffUser.branch}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-outline" style={{ padding: '0.5rem' }} onClick={() => {
                    setEditingSystemUserId(staffUser.id);
                    setEditSystemUserForm({ name: staffUser.name, role: staffUser.role, branch: staffUser.branch });
                  }}><Edit2 size={16} /></button>
                  <button className="btn-outline btn-outline-red" style={{ padding: '0.5rem' }} onClick={() => handleDeleteSystemUser(staffUser.id, staffUser.role)}>
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
