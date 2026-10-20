import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import './Navbar.css';

/**
 * ============================================================================
 * COMPONENTE: Navbar (Barra de Navegación Global y Estado de Sesión)
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTE COMPONENTE?
 * Renderiza la barra superior fija en toda la aplicación:
 * - Logotipo y nombre institucional de la aplicación.
 * - Datos del usuario conectado (Nombre y Sede asignada).
 * - Enlaces rápidos de navegación (Panel principal y Directorio).
 * - Botón para cerrar sesión.
 * - Menú responsive desplegable (hamburguesa) para pantallas móviles.
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 1. SRP (Responsabilidad Única):
 *    Se encarga únicamente de la cabecera de navegación y la interacción de menú.
 *    No procesa datos de estudiantes ni lógica de negocio.
 * 2. DIP (Inversión de Dependencias):
 *    Consume la sesión a través del hook `useAuth()`. No gestiona tokens ni Firebase directamente.
 */
const Navbar = () => {
  // Extraemos el usuario actual y la función logout del contexto global de autenticación
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Estado local para abrir o cerrar el menú en dispositivos móviles
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Manejador para cerrar sesión: invoca el logout centralizado y redirige a la vista de login
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Cierra el menú móvil al hacer clic en cualquier enlace
  const closeMenu = () => setIsMenuOpen(false);

  // Si no hay un usuario autenticado (por ejemplo, en la pantalla de Login), no renderizamos la barra
  if (!user) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container nav-container">
        
        {/* LOGO Y TÍTULO DE LA APP */}
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <img src={logoImg} alt="Experiencia Tomasina" className="nav-icon" />
          <span className="nav-title">Experiencia <span className="text-gradient">Tomasina</span></span>
        </Link>

        {/* BOTÓN HAMBURGUESA PARA PANTALLAS PEQUEÑAS (MÓVILES) */}
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle Menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* ENLACES DE NAVEGACIÓN Y PERFIL DE USUARIO */}
        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          
          {/* Información del usuario autenticado: Nombre y Sede */}
          <div className="user-info">
            <User size={18} className="user-icon" />
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-branch">{user.branch}</span>
            </div>
          </div>

          {/* Rutas principales del sistema */}
          <Link to="/" className="nav-link" onClick={closeMenu}>Panel</Link>
          <Link to="/directorio" className="nav-link" onClick={closeMenu}>Directorio</Link>

          {/* Botón de cierre de sesión */}
          <button onClick={handleLogout} className="logout-btn" title="Cerrar sesión">
            <LogOut size={18} />
            <span className="logout-text">Cerrar Sesión</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;

