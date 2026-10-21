import React, { useState } from 'react';
import { MapPin, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from './CustomSelect';
import { branchOptions } from '../constants/branches';
import '../pages/Login.css';

const roleOptions = [
  { value: 'director_dae', label: 'Director DAE' },
  { value: 'asistente_dae', label: 'Asistente DAE' },
  { value: 'coordinador', label: 'Coordinador' }
];

const CompleteStaffProfile = () => {
  const { user, completeProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [role, setRole] = useState(user?.role || 'asistente_dae');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Escribe tu nombre completo.');
      return;
    }
    if (!branch.trim()) {
      setMessage('Selecciona la sede que te corresponde.');
      return;
    }

    setSaving(true);
    setMessage('');
    try {
      await completeProfile({ name, branch, role });
    } catch (err) {
      setMessage('No se pudo guardar el perfil: ' + err.message);
      setSaving(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container glass-panel animate-fade-in">
        <div className="login-header">
          <div className="user-create-avatar" style={{ margin: '0 auto 0.5rem' }}>
            <UserRound size={36} color="white" />
          </div>
          <h1 className="login-title">Completa tu perfil</h1>
          <p className="login-subtitle">
            Tu cuenta {user?.email} quedó creada, pero no se guardó la sede.
            Elígela aquí para entrar al panel con tus datos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {message && <p className="login-error">{message}</p>}

          <div className="form-group">
            <label>Nombre completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre y apellido"
              required
            />
          </div>

          <div className="form-group">
            <label>Rol</label>
            <CustomSelect
              value={role}
              onChange={setRole}
              options={roleOptions}
              placeholder="Seleccionar rol"
            />
          </div>

          <div className="form-group">
            <label>Sede</label>
            <CustomSelect
              value={branch}
              onChange={setBranch}
              options={branchOptions}
              placeholder="Seleccionar sede"
            />
          </div>

          <button type="submit" className="create-btn" style={{ width: '100%', justifyContent: 'center' }} disabled={saving}>
            <MapPin size={18} />
            {saving ? 'Guardando...' : 'Guardar sede y continuar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteStaffProfile;
