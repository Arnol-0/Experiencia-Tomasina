import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import './index.css';

/**
 * 📌 ORDEN DE LOS PROVIDERS (importante):
 * `AuthProvider` va POR FUERA de `DataProvider` porque la capa de datos necesita
 * saber si hay sesión iniciada antes de suscribirse a Firestore. Si se suscribe
 * antes del login, las reglas rechazan la lectura (usuario anónimo) y el listener
 * queda sin datos en tiempo real: los cambios se guardan pero la interfaz no se
 * refresca hasta recargar la página.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <DataProvider>
        <App />
      </DataProvider>
    </AuthProvider>
  </React.StrictMode>,
);
