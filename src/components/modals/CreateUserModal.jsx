import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { ShieldPlus, Check } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { userService } from '../../services/userService';

const CreateUserModal = ({ isOpen, onClose, roleOptions, branchOptions }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('cordinador');
  const [newBranch, setNewBranch] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await userService.createSystemUser({
        email: newEmail,
        password: newPassword,
        name: newName,
        role: newRole,
        branch: newBranch
      });

      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        onClose();
        setNewEmail('');
        setNewPassword('');
        setNewName('');
      }, 2500);
    } catch (err) {
      setMessage('Error al crear usuario: ' + err.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="650px">
      {showSuccessAnim ? (
        <div className="success-animation-container animate-fade-in">
          <div className="success-checkmark">
            <Check size={40} color="white" strokeWidth={3} />
          </div>
          <h3>¡Usuario Creado!</h3>
          <p style={{ color: 'var(--text-muted)' }}>El acceso ha sido configurado correctamente.</p>
        </div>
      ) : (
        <>
          <div className="section-header">
            <ShieldPlus size={24} color="var(--color-primary)" />
            <h2>Crear Nuevo Usuario</h2>
          </div>
          
          <form onSubmit={handleCreateUser} className="create-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input type="text" value={newName} onChange={e=>setNewName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <CustomSelect 
                  value={newRole} 
                  onChange={setNewRole} 
                  options={roleOptions} 
                  placeholder="Seleccionar Rol" 
                />
              </div>
              <div className="form-group">
                <label>Sede</label>
                <CustomSelect 
                  value={newBranch} 
                  onChange={setNewBranch} 
                  options={branchOptions} 
                  placeholder="Seleccionar Sede" 
                />
              </div>
            </div>
            
            <button type="submit" className="create-btn" style={{ width: '100%', justifyContent: 'center' }}>Crear Usuario</button>
            {message && <p className="success-message" style={{ textAlign: 'center' }}>{message}</p>}
          </form>
        </>
      )}
    </BaseModal>
  );
};

export default CreateUserModal;
