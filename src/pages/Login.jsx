import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import logoImg from '../assets/logo.png';
import loginSvg from '../assets/Login.svg';
import lottie from 'lottie-web';
import loginAnimation from '../assets/Login.json';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lottieContainer = React.useRef(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    let anim;
    if (isLoading && lottieContainer.current) {
      anim = lottie.loadAnimation({
        container: lottieContainer.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: loginAnimation,
      });
    }
    return () => {
      if (anim) anim.destroy();
    };
  }, [isLoading]);

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Agregamos un pequeño retraso para que se pueda apreciar la animación
      await new Promise(resolve => setTimeout(resolve, 2000));
      await login(username, password);
      if (keepSignedIn) {
        localStorage.setItem('keepSignedIn', 'true');
      } else {
        localStorage.removeItem('keepSignedIn');
      }
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      setIsLoading(false);
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-loading-container animate-fade-in">
          <div ref={lottieContainer} style={{ width: 250, height: 250, margin: '0 auto' }}></div>
          <h2 className="loading-text text-gradient">Iniciando Sesión...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container glass-panel animate-fade-in">
        <div className="login-header">
          <img src={logoImg} alt="Experiencia Tomasina" className="login-icon" />
          <h1 className="login-title">Experiencia <span className="text-gradient">Tomasina</span></h1>
          <p className="login-subtitle">Inicia sesión </p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <p className="login-error">{error}</p>}

          <div className="form-group">
            <label htmlFor="username">Correo Electrónico</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej. admin@tuviaje.st"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              style={{ width: 'auto', marginBottom: 0, cursor: 'pointer' }}
            />
            <label htmlFor="keepSignedIn" style={{ marginBottom: 0, fontWeight: 'normal', cursor: 'pointer' }}>
              Mantener sesión activa
            </label>
          </div>

          <button type="submit" className="login-button">
            <LogIn size={20} />
            INICIAR SESIÓN
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
