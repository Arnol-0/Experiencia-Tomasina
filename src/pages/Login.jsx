import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn } from 'lucide-react';
import logoImg from '../assets/logo.png';
import loginSvg from '../assets/Login.svg';
import lottie from 'lottie-web';
import loginAnimation from '../assets/Login.json';
import './Login.css';

/**
 * ============================================================================
 * PÁGINA: Login (Inicio de Sesión y Acceso Seguro)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Se limita a la experiencia visual y captura de credenciales del usuario.
 *    No gestiona la persistencia de tokens de Firebase ni valida contraseñas a bajo nivel;
 *    eso lo delega al contexto de autenticación.
 * 
 * 2. DIP (Dependency Inversion Principle - Inversión de Dependencias):
 *    Usa el hook `useAuth()` para ejecutar `login()`, manteniendo la interfaz desacoplada
 *    del proveedor de autenticación.
 */
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const lottieContainer = React.useRef(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();


  // --------------------------------------------------------------------------
  // 1. EFECTO DE ANIMACIÓN LOTTIE
  // --------------------------------------------------------------------------
  // Carga e inicializa la animación vectorial JSON de Lottie cuando el usuario presiona "Iniciar Sesión"
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
    // Cleanup: Destruye la animación al desmontar para liberar memoria en el navegador
    return () => {
      if (anim) anim.destroy();
    };
  }, [isLoading]);

  // --------------------------------------------------------------------------
  // 2. REDIRECCIÓN AUTOMÁTICA
  // --------------------------------------------------------------------------
  // Si ya existe un usuario logueado en el contexto, lo redirigimos directamente a la pantalla de inicio (/)
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // --------------------------------------------------------------------------
  // 3. ENVÍO DEL FORMULARIO DE INICIO DE SESIÓN
  // --------------------------------------------------------------------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Agregamos un pequeño retraso (2 segundos) para que el usuario pueda apreciar la animación visual
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Inversión de dependencias (DIP): Delegamos la autenticación al contexto
      await login(username, password);
      
      // Persistencia de sesión elegida por el usuario:
      if (keepSignedIn) {
        localStorage.setItem('keepSignedIn', 'true'); // Deshabilita el auto-logout por inactividad
      } else {
        localStorage.removeItem('keepSignedIn');     // Se cerrará sesión a los 10 minutos de inactividad
      }
    } catch (err) {
      setError('Correo o contraseña incorrectos.');
      setIsLoading(false);
      console.error(err);
    }
  };

  // VISTA DE CARGA: Si está autenticando, muestra la animación Lottie a pantalla completa
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
      {/* TARJETA DE LOGIN CON EFECTO VIDRIO (GLASS-PANEL) */}
      <div className="login-container glass-panel animate-fade-in">
        
        {/* Cabecera institucional con Logo */}
        <div className="login-header">
          <img src={logoImg} alt="Experiencia Tomasina" className="login-icon" />
          <h1 className="login-title">Experiencia <span className="text-gradient">Tomasina</span></h1>
          <p className="login-subtitle">Inicia sesión en la plataforma</p>
        </div>

        {/* Formulario de credenciales */}
        <form onSubmit={handleLogin} className="login-form">
          {/* Mensaje de error en caso de credenciales incorrectas */}
          {error && <p className="login-error">{error}</p>}

          {/* Campo Correo Electrónico */}
          <div className="form-group">
            <label htmlFor="username">Correo Electrónico</label>
            <input
              type="email"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Correo@gmail.com"
              required
            />
          </div>

          {/* Campo Contraseña */}
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

          {/* Checkbox para mantener sesión activa (evita el temporizador de inactividad) */}
          <div className="form-group checkbox-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="keepSignedIn"
              checked={keepSignedIn}
              onChange={(e) => setKeepSignedIn(e.target.checked)}
              style={{ width: 'auto', marginBottom: 0, cursor: 'pointer', accentColor: 'var(--color-primary)' }}
            />
            <label htmlFor="keepSignedIn" style={{ marginBottom: 0, fontWeight: 'normal', cursor: 'pointer' }}>
              Mantener sesión activa
            </label>
          </div>

          {/* Botón de inicio de sesión */}
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
