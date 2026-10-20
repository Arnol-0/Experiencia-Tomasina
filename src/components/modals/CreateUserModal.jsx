import React, { useState } from 'react';
import BaseModal from './BaseModal';
import { ShieldPlus, Check } from 'lucide-react';
import CustomSelect from '../CustomSelect';
import { userService } from '../../services/userService';

import { validationService } from '../../services/validationService';

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
const CreateUserModal = ({ isOpen, onClose, roleOptions, branchOptions }) => {
  // Estados locales para los campos del formulario
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState('coordinador');
  const [newBranch, setNewBranch] = useState('');
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [message, setMessage] = useState('');

  /**
   * Procesa el envío del formulario con validaciones previas completas
   */
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage('');

    // 1. VALIDACIÓN: Nombre obligatorio
    if (!newName.trim()) {
      setMessage('El nombre completo es obligatorio.');
      return;
    }

    // 2. VALIDACIÓN: Formato de correo electrónico
    const emailValidation = validationService.validateEmail(newEmail);
    if (!emailValidation.isValid) {
      setMessage(emailValidation.error);
      return;
    }

    // 3. VALIDACIÓN: Seguridad de contraseña
    if (!newPassword || newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // 4. VALIDACIÓN: Sede obligatoria para roles locales
    const isGlobalRole = newRole === 'coordinador' || newRole === 'admin';
    if (!isGlobalRole && !newBranch.trim()) {
      setMessage('Debes seleccionar una sede para este usuario.');
      return;
    }

    try {
      await userService.createSystemUser({
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
        branch: isGlobalRole ? '' : newBranch
      });

      // Muestra animación amigable de éxito
      setShowSuccessAnim(true);
      setTimeout(() => {
        setShowSuccessAnim(false);
        onClose();
        // Limpiamos los campos para el próximo uso
        setNewEmail('');
        setNewPassword('');
        setNewName('');
        setMessage('');
      }, 2500);
    } catch (err) {
      setMessage('Error al crear usuario: ' + err.message);
      setTimeout(() => setMessage(''), 5000);
    }
  };



  return (
    // BaseModal proporciona el fondo translúcido, centrado y botón de cierre automático
    <BaseModal isOpen={isOpen} onClose={onClose} maxWidth="650px">
      
      {/* RENDERIZADO CONDICIONAL: Si el usuario fue creado, muestra animación de confirmación */}
      {showSuccessAnim ? (
        <div className="success-animation-container animate-fade-in">
          {/* Círculo verde con check de verificación */}
          <div className="success-checkmark">
            <Check size={40} color="white" strokeWidth={3} />
          </div>
          <h3>¡Usuario Creado!</h3>
          <p style={{ color: 'var(--text-muted)' }}>El acceso ha sido configurado correctamente.</p>
        </div>
      ) : (
        // De lo contrario, muestra el formulario de ingreso
        <>
          {/* Cabecera del modal: Icono de escudo y título */}
          <div className="section-header">
            <ShieldPlus size={24} color="var(--color-primary)" />
            <h2>Crear Nuevo Usuario</h2>
          </div>
          
          <form onSubmit={handleCreateUser} className="create-user-form">
            {/* FILA 1: Correo electrónico y Contraseña */}
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
            
            {/* FILA 2: Nombre, Rol y Sede */}
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
                {/* Selector accesible y desacoplado de roles */}
                <CustomSelect 
                  value={newRole} 
                  onChange={setNewRole} 
                  options={roleOptions} 
                  placeholder="Seleccionar Rol" 
                />
              </div>

              {/* LÓGICA DE NEGOCIO: Si el rol es 'coordinador' o 'admin', tiene alcance nacional,
                  por lo que ocultamos el selector de sede para evitar asignaciones erróneas */}
              {(newRole !== 'coordinador' && newRole !== 'admin') && (
                <div className="form-group">
                  <label>Sede</label>
                  <CustomSelect 
                    value={newBranch} 
                    onChange={setNewBranch} 
                    options={branchOptions} 
                    placeholder="Seleccionar Sede" 
                  />
                </div>
              )}
            </div>
            
            {/* Botón de envío del formulario */}
            <button type="submit" className="create-btn" style={{ width: '100%', justifyContent: 'center' }}>
              Crear Usuario
            </button>

            {/* Mensaje de retroalimentación en caso de error */}
            {message && <p className="success-message" style={{ textAlign: 'center' }}>{message}</p>}
          </form>
        </>
      )}
    </BaseModal>
  );
};

export default CreateUserModal;
