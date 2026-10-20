import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Directory from './pages/Directory';
import StudentProfile from './pages/StudentProfile';
import Login from './pages/Login';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * ============================================================================
 * COMPONENTE RAÍZ: App (Enrutador Principal y Protección de Rutas)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. OCP (Open/Closed):
 *    <ErrorBoundary> envuelve toda la jerarquía de vistas protegiendo el sistema
 *    contra fallos inesperados sin invadir los componentes hijos.
 * 
 * 2. SRP (Responsabilidad Única):
 *    Se limita a definir el mapa de rutas y la estructura de navegación global.
 */

// Componente de Orden Superior (HOC) para proteger rutas privadas
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Cargando...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};


function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="app-layout">
          <Navbar />
          <main>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/directorio" element={<PrivateRoute><Directory /></PrivateRoute>} />
              <Route path="/student/:id" element={<PrivateRoute><StudentProfile /></PrivateRoute>} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
