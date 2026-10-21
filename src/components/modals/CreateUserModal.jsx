import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { ShieldPlus, Check, UserPlus, MapPin, Mail, Globe2 } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { userService } from '../../services/userService';

import { validationService } from '../../services/validationService';
import { ROLES, resolveBranchForRole } from '../../utils/permissions';

/**
 * ============================================================================
 * MODAL: CreateUserModal (Crear Nuevo Usuario del Sistema)
 * ============================================================================
 *
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Solo maneja el formulario y la experiencia de usuario para registrar un nuevo
 *    miembro del personal (asistente, director, etc.).
 * 2. DIP (Inversión de Dependencias):
 *    No interactúa directamente con los SDKs de Firebase; llama a 'userService.createSystemUser'.
 * 3. Composición (favorecida en SOLID / OCP):
 *    Usa <BaseModal> como envoltorio, reutilizando toda la estructura sin duplicar código.
 */
const CreateUserModal = ({ isOpen, onClose, onCreated, roleOptions, branchOptions }) => {
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState(ROLES.DIRECTOR);
  const [newBranch, setNewBranch] = useState('');
  const [phase, setPhase] = useState('form'); // form | creating | success
  const [createdSummary, setCreatedSummary] = useState(null);
  const [message, setMessage] = useState('');

  // El coordinador es nacional: se crea sin sede (alcance 'Todas las Sedes').
  const isNationalRole = newRole === ROLES.COORDINATOR;

  const resetForm = () => {
    setNewEmail('');
    setNewPassword('');
    setNewName('');
    setNewRole(ROLES.DIRECTOR);
    setNewBranch('');
    setMessage('');
    setCreatedSummary(null);
    setPhase('form');
  };

  const handleClose = () => {
    if (phase === 'creating') return;
    resetForm();
    onClose();
  };

  const roleLabel = (role) => {
    const found = roleOptions?.find((opt) => (typeof opt === 'object' ? opt.value : opt) === role);
    return found && typeof found === 'object' ? found.label : role;
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (phase !== 'form') return;
    setMessage('');

    if (!newName.trim()) {
      setMessage('El nombre completo es obligatorio.');
      return;
    }

    const emailValidation = validationService.validateEmail(newEmail);
    if (!emailValidation.isValid) {
      setMessage(emailValidation.error);
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    const assignedBranch = isNationalRole ? '' : newBranch.trim();
    if (!isNationalRole && !assignedBranch) {
      setMessage('Debes seleccionar una sede para este usuario.');
      return;
    }

    // El coordinador se guarda con alcance nacional ('Todas las Sedes').
    const payload = {
      email: newEmail.trim().toLowerCase(),
      password: newPassword,
      name: newName.trim(),
      role: newRole,
      branch: resolveBranchForRole(newRole, assignedBranch)
    };

    setPhase('creating');

    try {
      await userService.createSystemUser(payload);

      setCreatedSummary({
        name: payload.name,
        email: payload.email,
        role: roleLabel(payload.role),
        branch: payload.branch
      });
      setPhase('success');
      onCreated?.();

      setTimeout(() => {
        resetForm();
        onClose();
      }, 2800);
    } catch (err) {
      setPhase('form');
      setMessage('Error al crear usuario: ' + err.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={handleClose} maxWidth="650px">
      {phase === 'creating' && (
        <div className="user-create-anim animate-fade-in" aria-live="polite">
          <div className="user-create-orbit">
            <span className="user-create-orbit-ring" />
            <span className="user-create-orbit-ring delay" />
            <div className="user-create-avatar">
              <UserPlus size={36} color="white" strokeWidth={2.4} />
            </div>
            <span className="user-create-dot d1" />
            <span className="user-create-dot d2" />
            <span className="user-create-dot d3" />
          </div>
          <h3>Creando usuario...</h3>
          <p className="user-create-subtitle">Registrando acceso y asignando la sede</p>
          <div className="user-create-steps">
            <span className="user-create-step active">Cuenta</span>
            <span className="user-create-step-line" />
            <span className="user-create-step active delay">Sede</span>
            <span className="user-create-step-line" />
            <span className="user-create-step delay-2">Listo</span>
          </div>
          <div className="user-create-bar">
            <span className="user-create-bar-fill" />
          </div>
        </div>
      )}

      {phase === 'success' && (
        <div className="success-animation-container animate-fade-in" aria-live="polite">
          <div className="success-burst">
            <span className="success-particle p1" />
            <span className="success-particle p2" />
            <span className="success-particle p3" />
            <span className="success-particle p4" />
            <span className="success-particle p5" />
            <span className="success-particle p6" />
            <div className="success-checkmark">
              <Check size={40} color="white" strokeWidth={3} />
            </div>
          </div>
          <h3>¡Usuario creado!</h3>
          <p style={{ color: 'var(--text-muted)' }}>El acceso quedó configurado con su sede.</p>
          {createdSummary && (
            <div className="created-user-summary">
              <strong>{createdSummary.name}</strong>
              <span><Mail size={14} /> {createdSummary.email}</span>
              <span>{createdSummary.role}</span>
              <span className="created-user-branch"><MapPin size={14} /> {createdSummary.branch}</span>
            </div>
          )}
        </div>
      )}

      {phase === 'form' && (
        <>
          <div className="section-header">
            <ShieldPlus size={24} color="var(--color-primary)" />
            <h2>Crear Nuevo Usuario</h2>
          </div>

          <form onSubmit={handleCreateUser} className="create-user-form">
            <div className="form-row">
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="ejemplo@santotomas.cl"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Nombre Completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Nombre y Apellido"
                  required
                />
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
            </div>

            <div className="form-group">
              <label>Sede</label>
              {isNationalRole ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary-dark)',
                    fontWeight: '600'
                  }}
                >
                  <Globe2 size={18} />
                  Todas las Sedes (Nacional)
                </div>
              ) : (
                <CustomSelect
                  value={newBranch}
                  onChange={setNewBranch}
                  options={branchOptions}
                  placeholder="Seleccionar Sede"
                />
              )}
            </div>

            <button type="submit" className="create-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Crear Usuario
            </button>

            {message && <p className="success-message" style={{ textAlign: 'center', color: '#b91c1c' }}>{message}</p>}
          </form>
        </>
      )}
    </BaseModal>
  );
};

export default CreateUserModal;
