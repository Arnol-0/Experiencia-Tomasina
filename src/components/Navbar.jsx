import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMenu = () => setIsMenuOpen(false);

  if (!user) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="container nav-container">
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <img src={logoImg} alt="Experiencia Tomasina" className="nav-icon" />
          <span className="nav-title">Experiencia <span className="text-gradient">Tomasina</span></span>
        </Link>

        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle Menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav className={`nav-links ${isMenuOpen ? 'open' : ''}`}>
          <div className="user-info">
            <User size={18} className="user-icon" />
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-branch">{user.branch}</span>
            </div>
          </div>
          <Link to="/" className="nav-link" onClick={closeMenu}>Panel</Link>
          <Link to="/directorio" className="nav-link" onClick={closeMenu}>Directorio</Link>
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
