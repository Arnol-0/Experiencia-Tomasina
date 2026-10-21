import React, { useState } from 'react';
import { MapPin, UserRound, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from './CustomSelect';
import { branchOptions } from '../constants/branches';
import { ROLES } from '../utils/permissions';
import '../pages/Login.css';

const roleOptions = [
  { value: ROLES.DIRECTOR, label: 'Director DAE' },
  { value: ROLES.ASSISTANT, label: 'Asistente DAE' },
  { value: ROLES.COORDINATOR, label: 'Coordinador (Nacional)' }
];

const CompleteStaffProfile = () => {
  const { user, completeProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [branch, setBranch] = useState(user?.branch || '');
  const [role, setRole] = useState(user?.role || ROLES.ASSISTANT);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  // El coordinador es nacional: no se le pide sede.
  const isNationalRole = role === ROLES.COORDINATOR;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setMessage('Escribe tu nombre completo.');
      return;
    }
    if (!isNationalRole && !branch.trim()) {
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
            Tu cuenta {user?.email} quedó creada, pero faltan tus datos de acceso.
            Complétalos aquí para entrar al panel.
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

          {/* El coordinador es nacional: se muestra el alcance en vez del selector de sede */}
          {isNationalRole ? (
            <div className="form-group">
              <label>Alcance</label>
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
              <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--text-muted)' }}>
                El rol coordinador opera sobre todas las sedes del país, por lo que no se asigna una sede específica.
              </small>
            </div>
          ) : (
            <div className="form-group">
              <label>Sede</label>
              <CustomSelect
                value={branch}
                onChange={setBranch}
                options={branchOptions}
                placeholder="Seleccionar sede"
              />
            </div>
          )}

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
