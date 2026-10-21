import { db, firebaseConfig } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ROLES, resolveBranchForRole } from '../utils/permissions';

/**
 * ============================================================================
 * SERVICIO: userService (Gestión de Usuarios del Sistema / Staff)
 * ============================================================================
 *
 * 📌 PRINCIPIO SOLID APLICADO:
 * 1. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Este archivo tiene una ÚNICA responsabilidad: comunicarse con Firebase para
 *    hacer operaciones CRUD (Crear, Leer, Actualizar, Borrar) sobre los usuarios.
 *    No maneja nada de diseño, HTML, botones ni estados visuales.
 *
 * 2. DIP (Dependency Inversion Principle - Inversión de Dependencias):
 *    Los componentes visuales (como modales o páginas) no hacen llamadas directas
 *    a las APIs de Firebase en su código visual; en su lugar, delegan la tarea a este servicio.
 */
const inviteIdFromEmail = (email) => email.trim().toLowerCase();

export const userService = {
  /**
   * 1. Obtener todos los usuarios del sistema (coordinadores, asistentes, directores)
   * Consulta la colección 'users' en Firestore y devuelve un arreglo limpio de objetos.
   */
  fetchSystemUsers: async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
  },

  /**
   * 2. Crear un nuevo usuario en el sistema
   * TRUCO TÉCNICO IMPORTANTE:
   * En Firebase, si un administrador crea un usuario con createUserWithEmailAndPassword,
   * Firebase automáticamente cierra la sesión del admin y lo loguea como el nuevo usuario.
   * Para evitar esto, inicializamos una instancia secundaria ("Secondary") de Firebase Auth,
   * creamos la cuenta allí, guardamos sus datos en Firestore y cerramos la sesión secundaria,
   * manteniendo la sesión del administrador activa y segura.
   *
   * El perfil se escribe con la sesión del usuario nuevo (Firestore secundario), porque
   * las reglas suelen permitir solo `request.auth.uid == userId`. Si el admin escribe
   * `users/{uidAjeno}`, Authentication queda creado y el perfil no: al entrar se ve "Sin Sede".
   */
  createSystemUser: async ({ email, password, name, role, branch }) => {
    const assignedName = typeof name === 'string' ? name.trim() : '';

    // El coordinador es NACIONAL: se le asigna 'Todas las Sedes' sin forzarle una sede.
    const assignedBranch = resolveBranchForRole(role, branch);

    if (!assignedName) {
      throw new Error('El nombre es obligatorio para crear el usuario.');
    }
    if (role !== ROLES.COORDINATOR && role !== ROLES.ADMIN && !assignedBranch) {
      throw new Error('La sede es obligatoria para crear el usuario.');
    }
    const assignedEmail = inviteIdFromEmail(email);

    const secondaryApp = getApps().find(app => app.name === 'Secondary')
      || initializeApp(firebaseConfig, 'Secondary');
    const secondaryAuth = getAuth(secondaryApp);
    const secondaryDb = getFirestore(secondaryApp);

    const userCred = await createUserWithEmailAndPassword(secondaryAuth, assignedEmail, password);
    const uid = userCred.user.uid;
    await userCred.user.getIdToken(true);

    const profile = {
      name: assignedName,
      role,
      branch: assignedBranch,
      email: assignedEmail
    };

    // Invitación por correo: si el write de users/{uid} falla por reglas, el login puede hidratar el perfil.
    try {
      await setDoc(doc(db, 'userInvites', assignedEmail), { ...profile, uid });
    } catch (inviteErr) {
      console.warn('No se pudo guardar la invitación de usuario:', inviteErr);
    }

    try {
      await setDoc(doc(secondaryDb, 'users', uid), profile);
    } catch (secondaryErr) {
      try {
        await setDoc(doc(db, 'users', uid), profile);
      } catch (primaryErr) {
        await signOut(secondaryAuth);
        throw new Error(
          'La cuenta de acceso se creó, pero no se pudo guardar nombre y sede. ' +
          (secondaryErr.message || primaryErr.message)
        );
      }
    }

    await signOut(secondaryAuth);
    return { uid, ...profile };
  },

  /**
   * 3. Actualizar datos de un usuario existente (nombre, rol, sede)
   */
  updateSystemUser: async (id, data) => {
    await updateDoc(doc(db, 'users', id), data);
  },

  /**
   * 4. Eliminar el registro del usuario en Firestore
   */
  deleteSystemUser: async (id) => {
    await deleteDoc(doc(db, 'users', id));
  }
};
