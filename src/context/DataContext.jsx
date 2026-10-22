import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  deleteDoc, 
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter 
} from 'firebase/firestore';

/**
 * ============================================================================
 * CONTEXTO: DataContext (Gestión Global de Datos de Estudiantes y Consultas Firestore)
 * ============================================================================
 * 
 * 📌 PRINCIPIOS SOLID APLICADOS:
 * 
 * 1. DIP (Dependency Inversion Principle - Inversión de Dependencias):
 *    Los componentes visuales (Directory, Dashboard, StudentProfile) NO importan
 *    ni conocen los detalles de bajo nivel de Firestore (query, where, limit, startAfter).
 *    En su lugar, consumen este Contexto a través de la abstracción `useData()`.
 *    Si en el futuro se migra a otra base de datos, los componentes permanecen intactos.
 * 
 * 2. SRP (Single Responsibility Principle - Responsabilidad Única):
 *    Centraliza la persistencia, las consultas optimizadas por sede, la paginación
 *    por bloques y el ciclo de vida de los datos de estudiantes.
 * 
 * 3. OCP (Open/Closed Principle - Abierto para Extensión / Cerrado para Modificación):
 *    `fetchStudentsPaginated` permite parametrizar filtros por sede, campos de orden,
 *    tamaños de bloque y cursores sin necesidad de alterar su lógica base.
 */
const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [studentsList, setStudentsList] = useState([]);

  // 📌 DIP + SRP: la capa de datos pregunta por la sesión a través de la
  // abstracción `useAuth()` en lugar de conocer detalles de Firebase Auth.
  const { user } = useAuth();
  const userId = user?.uid || null;

  // Suscripción en tiempo real a la colección 'students' de Firestore.
  //
  // 📌 ¿POR QUÉ DEPENDE DE LA SESIÓN?
  // Si el listener se creara antes del login (usuario anónimo), Firestore lo
  // rechazaría por reglas de seguridad y la app quedaría mostrando datos viejos
  // de la caché: las escrituras se guardaban, pero la pantalla no se refrescaba.
  // Al suscribirnos sólo con sesión activa, el tiempo real funciona siempre.
  useEffect(() => {
    if (!userId) return undefined;

    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = [];
      snapshot.forEach((docSnap) => {
        students.push({ id: docSnap.id, ...docSnap.data() });
      });
      setStudentsList(students);
    }, (error) => {
      console.warn("Aviso en listener en tiempo real de Firestore (posible modo offline):", error);
    });

    // Cleanup: al cerrar sesión (o cambiar de usuario) se cancela la suscripción
    // y se vacía la lista para no dejar datos del usuario anterior en pantalla.
    return () => {
      unsubscribe();
      setStudentsList([]);
    };
  }, [userId]);

  /**
   * ============================================================================
   * CONSULTA PAGINADA Y OPTIMIZADA A FIRESTORE (Lazy Loading / Bloques de 20)
   * ============================================================================
   * 
   * 📌 REQUERIMIENTO CUMPLIDO:
   * Reemplaza las descargas masivas por consultas en bloques (de 20 en 20)
   * usando limit(), startAfter() y filtros directos con where('branch', '==', branch).
   * 
   * 📌 GESTIÓN DE ÍNDICES COMPUESTOS:
   * Al combinar un filtro de igualdad `where('branch', '==', ...)` con un ordenamiento
   * `orderBy('name', 'asc')`, Firestore requiere un índice compuesto. Si aún no ha sido
   * creado en Firebase Console, Firestore lanza un error 'failed-precondition'.
   * 
   * Manejo defensivo:
   * 1. Extrae la URL oficial de creación de índice provista por Firebase.
   * 2. Emite una advertencia didáctica en consola con el enlace directo.
   * 3. Ejecuta una consulta de respaldo segura (sin orderBy en Firestore, ordenando en memoria)
   *    para que la aplicación NUNCA se caiga ni deje al usuario con la pantalla rota.
   * 
   * @param {Object} params
   * @param {string|null} params.branch - Nombre de la sede ('todas' o null para ver todas)
   * @param {number} params.pageSize - Tamaño de bloque (por defecto 20)
   * @param {any} params.lastDoc - DocumentSnapshot del último alumno cargado
   * @param {string} params.orderByField - Campo de orden ('name')
   * @param {'asc'|'desc'} params.orderDirection - Dirección ('asc')
   * @returns {Promise<{ students: Array, lastVisibleDoc: any, hasMore: boolean, indexRequiredUrl: string|null }>}
   */
  const fetchStudentsPaginated = async ({
    branch = null,
    pageSize = 20,
    lastDoc = null,
    orderByField = 'name',
    orderDirection = 'asc'
  } = {}) => {
    const isFilteredByBranch = branch && 
      branch !== 'all' && 
      branch.toLowerCase() !== 'todas' && 
      branch.toLowerCase() !== 'todas las sedes';

    try {
      const constraints = [];

      // 1. Filtro directo por sede si no se seleccionaron todas
      if (isFilteredByBranch) {
        constraints.push(where('branch', '==', branch));
      }

      // 2. Ordenamiento en Firestore
      if (orderByField) {
        constraints.push(orderBy(orderByField, orderDirection));
      }

      // 3. Cursor startAfter para paginación incremental
      if (lastDoc) {
        constraints.push(startAfter(lastDoc));
      }

      // 4. Límite de bloque de carga (ej: 20 registros)
      constraints.push(limit(pageSize));

      const studentsQuery = query(collection(db, 'students'), ...constraints);
      const snapshot = await getDocs(studentsQuery);

      const students = [];
      snapshot.forEach((docSnap) => {
        students.push({ id: docSnap.id, ...docSnap.data(), _docSnapshot: docSnap });
      });

      const lastVisibleDoc = snapshot.docs.length > 0 
        ? snapshot.docs[snapshot.docs.length - 1] 
        : null;

      const hasMore = snapshot.docs.length === pageSize;

      return {
        students,
        lastVisibleDoc,
        hasMore,
        indexRequiredUrl: null
      };
    } catch (error) {
      console.warn("Aviso en consulta paginada Firestore:", error);

      // Detección de solicitud de Índice Compuesto por parte de Firestore
      const isIndexError = error.code === 'failed-precondition' || 
        (error.message && error.message.includes('requires an index'));

      if (isIndexError) {
        const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]*/);
        const indexUrl = urlMatch ? urlMatch[0] : null;

        console.warn(
          "⚠️ FIRESTORE REQUIERE UN ÍNDICE COMPUESTO:\n" +
          `Para combinar where('branch', '==', '${branch}') con orderBy('${orderByField}', '${orderDirection}'), ` +
          "debes crearlo en la Consola de Firebase con un solo clic en este enlace:\n" +
          (indexUrl || error.message)
        );

        // CONSULTA DE RESPALDO (Fallback seguro):
        // Consultamos con filtro de sede y límite sin el orderBy compuesto en servidor,
        // ordenando los resultados en memoria en el cliente para no bloquear al usuario.
        try {
          const fallbackConstraints = [];
          if (isFilteredByBranch) {
            fallbackConstraints.push(where('branch', '==', branch));
          }
          if (lastDoc) {
            fallbackConstraints.push(startAfter(lastDoc));
          }
          fallbackConstraints.push(limit(pageSize));

          const fallbackQuery = query(collection(db, 'students'), ...fallbackConstraints);
          const fallbackSnap = await getDocs(fallbackQuery);

          const students = [];
          fallbackSnap.forEach((docSnap) => {
            students.push({ id: docSnap.id, ...docSnap.data(), _docSnapshot: docSnap });
          });

          // Ordenamiento en memoria del cliente
          if (orderByField) {
            students.sort((a, b) => {
              const valA = String(a[orderByField] || '').toLowerCase();
              const valB = String(b[orderByField] || '').toLowerCase();
              return orderDirection === 'asc' 
                ? valA.localeCompare(valB) 
                : valB.localeCompare(valA);
            });
          }

          const lastVisibleDoc = fallbackSnap.docs.length > 0 
            ? fallbackSnap.docs[fallbackSnap.docs.length - 1] 
            : null;

          const hasMore = fallbackSnap.docs.length === pageSize;

          return {
            students,
            lastVisibleDoc,
            hasMore,
            indexRequiredUrl: indexUrl
          };
        } catch (fallbackErr) {
          console.error("Error ejecutando consulta de respaldo:", fallbackErr);
          throw fallbackErr;
        }
      }

      throw error;
    }
  };

  /**
   * Obtiene un estudiante por su ID buscando primero en memoria o en la caché/Firestore
   */
  const getStudentById = async (id) => {
    if (!id) return null;
    const fromState = studentsList.find(s => s.id === id);
    if (fromState) return fromState;

    try {
      const docRef = doc(db, 'students', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (err) {
      console.error(`Error buscando estudiante por ID (${id}):`, err);
      return null;
    }
  };

  /**
   * Agrega o actualiza masivamente estudiantes (por ejemplo al importar desde Excel)
   * REGLA DE INTEGRIDAD DE DATOS:
   * Si el estudiante ya existe en la base de datos, usamos merge: true para actualizar
   * solo sus datos académicos/personales SIN BORRAR los pines que ya haya ganado.
   */
  const addStudents = async (newStudents) => {
    for (const student of newStudents) {
      const docRef = doc(db, 'students', student.id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        // Actualización segura: preserva pines ganados previamente
        await setDoc(docRef, {
          name: student.name,
          rut: student.rut,
          grade: student.grade,
          jornada: student.jornada,
          branch: student.branch,
          institutionType: student.institutionType,
          avatar: student.avatar
        }, { merge: true });
      } else {
        // Si no existe, creamos el documento nuevo completo
        await setDoc(docRef, student);
      }
    }
  };

  /**
   * Actualiza los datos de un estudiante específico preservando los demás campos
   */
  const updateStudent = async (id, data) => {
    await setDoc(doc(db, 'students', id), data, { merge: true });
  };

  /**
   * Elimina un estudiante por su ID
   */
  const deleteStudent = async (id) => {
    await deleteDoc(doc(db, 'students', id));
  };

  /**
   * Elimina en lote a todos los estudiantes que pertenecen a una sede específica
   * Realiza consulta directa por sede con where() para máxima precisión.
   */
  const deleteStudentsByBranch = async (branch) => {
    try {
      const q = query(collection(db, 'students'), where('branch', '==', branch));
      const snapshot = await getDocs(q);
      const promises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'students', docSnap.id)));
      await Promise.all(promises);
    } catch (err) {
      console.error(`Error eliminando estudiantes de la sede ${branch}:`, err);
      throw err;
    }
  };

  return (
    <DataContext.Provider value={{ 
      studentsList, 
      fetchStudentsPaginated,
      getStudentById,
      addStudents, 
      updateStudent, 
      deleteStudent, 
      deleteStudentsByBranch 
    }}>
      {children}
    </DataContext.Provider>
  );
};

// Hook personalizado para acceder fácilmente al contexto
export const useData = () => useContext(DataContext);
