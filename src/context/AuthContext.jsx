import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { NATIONAL_BRANCH } from '../constants/branches';
import { ROLES, resolveBranchForRole } from '../utils/permissions';

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

const buildSessionUser = (currentUser, profile = {}) => ({
  uid: currentUser.uid,
  email: currentUser.email,
  displayName: currentUser.displayName,
  ...profile
});

const isProfileIncomplete = (profile) => {
  if (!profile) return true;
  if (profile.role === ROLES.ADMIN) return false;

  const hasName = Boolean(String(profile.name || '').trim());
  const hasRole = Boolean(String(profile.role || '').trim());

  // El coordinador es nacional: NO necesita sede asignada.
  if (profile.role === ROLES.COORDINATOR) {
    return !hasName || !hasRole;
  }

  const hasBranch = Boolean(String(profile.branch || '').trim());
  return !hasName || !hasBranch || !hasRole;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimerRef = useRef(null);

  const persistProfile = async (uid, profile) => {
    await setDoc(doc(db, 'users', uid), profile, { merge: true });
  };

  const hydrateProfile = async (currentUser) => {
    let profile = {};
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists()) {
      profile = userDoc.data() || {};
    }

    const emailKey = currentUser.email?.trim().toLowerCase();
    if (emailKey && isProfileIncomplete(profile)) {
      const inviteSnap = await getDoc(doc(db, 'userInvites', emailKey));
      if (inviteSnap.exists()) {
        const invite = inviteSnap.data() || {};
        profile = {
          ...invite,
          ...profile,
          name: profile.name || invite.name,
          role: profile.role || invite.role,
          branch: profile.branch || invite.branch,
          email: emailKey
        };
        await persistProfile(currentUser.uid, {
          name: profile.name,
          role: profile.role,
          branch: profile.branch,
          email: emailKey
        });
      }
    }

    // El coordinador es NACIONAL: aunque el perfil o la invitación traigan una sede
    // concreta, su alcance real es 'Todas las Sedes'.
    if (profile.role) {
      profile = { ...profile, branch: resolveBranchForRole(profile.role, profile.branch) };
    }

    return buildSessionUser(currentUser, profile);
  };

  // 1. Monitoreo del estado de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const sessionUser = await hydrateProfile(currentUser);
          setUser(sessionUser);
        } catch (err) {
          console.error("Error al obtener usuario:", err);
          setUser(buildSessionUser(currentUser));
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

  const completeProfile = async ({ name, branch, role }) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No hay una sesión activa.');
    }

    const finalRole = role || user?.role || ROLES.ASSISTANT;

    // El coordinador (y el admin) son de alcance NACIONAL:
    // se les asigna 'Todas las Sedes' y nunca se les fuerza una sede concreta.
    const finalBranch = resolveBranchForRole(finalRole, branch);

    if (finalRole !== ROLES.COORDINATOR && finalRole !== ROLES.ADMIN && !finalBranch) {
      throw new Error('Debes seleccionar la sede que te corresponde.');
    }

    const profile = {
      name: String(name || '').trim(),
      branch: finalBranch || NATIONAL_BRANCH,
      role: finalRole,
      email: currentUser.email?.trim().toLowerCase() || ''
    };

    await persistProfile(currentUser.uid, profile);
    setUser(buildSessionUser(currentUser, { ...user, ...profile }));
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

  const needsProfile = Boolean(user && isProfileIncomplete(user));

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, needsProfile, completeProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
