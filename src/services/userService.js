import { db, firebaseConfig } from '../firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

export const userService = {
  /**
   * Fetches all system users (staff) from Firestore
   */
  fetchSystemUsers: async () => {
    const querySnapshot = await getDocs(collection(db, 'users'));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  /**
   * Creates a new system user using a secondary Firebase Auth instance
   * so the admin's session is not terminated.
   */
  createSystemUser: async ({ email, password, name, role, branch }) => {
    const secondaryApp = initializeApp(firebaseConfig, "Secondary");
    const secondaryAuth = getAuth(secondaryApp);
    
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    
    await setDoc(doc(db, 'users', userCred.user.uid), {
      name,
      role,
      branch,
      email
    });
    
    await signOut(secondaryAuth);
  },

  /**
   * Updates an existing system user's profile in Firestore
   */
  updateSystemUser: async (id, data) => {
    await updateDoc(doc(db, 'users', id), data);
  },

  /**
   * Deletes a system user's profile from Firestore
   * Note: This does not delete the user from Firebase Auth due to client-side limitations.
   */
  deleteSystemUser: async (id) => {
    await deleteDoc(doc(db, 'users', id));
  }
};
