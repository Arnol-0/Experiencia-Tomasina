import { db, firebaseConfig } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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
export const userService = {
  /**
   * 1. Obtener todos los usuarios del sistema (coordinadores, asistentes, directores)
   * Consulta la colección 'users' en Firestore y devuelve un arreglo limpio de objetos.
   */
  fetchSystemUsers: async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * 2. Crear un nuevo usuario en el sistema
   * TRUCO TÉCNICO IMPORTANTE:
   * En Firebase, si un administrador crea un usuario con createUserWithEmailAndPassword,
   * Firebase automáticamente cierra la sesión del admin y lo loguea como el nuevo usuario.
   * Para evitar esto, inicializamos una instancia secundaria ("Secondary") de Firebase Auth,
   * creamos la cuenta allí, guardamos sus datos en Firestore y cerramos la sesión secundaria,
   * manteniendo la sesión del administrador activa y segura.
   */
  createSystemUser: async ({ email, password, name, role, branch }) => {
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);
    
    // Crea las credenciales en Authentication
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    // Guarda el perfil y rol en la base de datos Firestore
    await setDoc(doc(db, 'users', userCred.user.uid), {
      name,
      role,
      branch,
      email
    });
    
    // Cierra la sesión secundaria para que no interfiera con el admin actual
    await signOut(secondaryAuth);
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

