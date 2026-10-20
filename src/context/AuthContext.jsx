import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

/**
 * ============================================================================
 * CONTEXTO: AuthContext (Autenticación y Ciclo de Vida de Sesión)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Se encarga de una sola cosa: la identidad del usuario logueado, su sesión
 *    y la seguridad de inactividad. Ningún componente visual necesita preocuparse
 *    por tokens, listeners de Auth o temporizadores de desconexión.
 * 
 * 2. DIP (Dependency Inversion Principle - Inversión de Dependencias):
 *    Toda la aplicación consume la sesión mediante el hook `useAuth()`.
 *    Si cambia la forma de autenticar (por ejemplo a OAuth o Auth0), la interfaz
 *    permanece intacta.
 */
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  // 1. Monitoreo del estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // Buscamos información extendida del usuario (rol, sede, nombre) en Firestore
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUser({ ...currentUser, ...userData });
          } else {
            setUser(currentUser);
          }
        } catch (err) {
          console.error("Error al obtener usuario:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Iniciar sesión
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // 3. Cerrar sesión y limpiar rastros
  const logout = () => {
    localStorage.removeItem('keepSignedIn');
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    return signOut(auth);
  };

  // 4. Temporizador de inactividad (Cierre de sesión automático tras 10 min)
  useEffect(() => {
    // Si no hay usuario o si marcó la casilla "Mantener sesión activa", no activamos el autologout
    if (!user || localStorage.getItem('keepSignedIn') === 'true') {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutos en milisegundos

    const resetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        logout();
      }, INACTIVITY_LIMIT);
    };


    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    
    events.forEach(event => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
