import React, { createContext, useState, useContext, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, setDoc, doc, deleteDoc } from 'firebase/firestore';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [studentsList, setStudentsList] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'students'), (snapshot) => {
      const students = [];
      snapshot.forEach((doc) => {
        students.push({ id: doc.id, ...doc.data() });
      });
      setStudentsList(students);
    });

    return () => unsubscribe();
  }, []);

  const addStudents = async (newStudents) => {
    for (const student of newStudents) {
      await setDoc(doc(db, 'students', student.id), student);
    }
  };

  const updateStudent = async (id, data) => {
    await setDoc(doc(db, 'students', id), data, { merge: true });
  };

  const deleteStudent = async (id) => {
    await deleteDoc(doc(db, 'students', id));
  };

  const deleteStudentsByBranch = async (branch) => {
    const studentsToDelete = studentsList.filter(s => s.branch === branch);
    const promises = studentsToDelete.map(student => deleteDoc(doc(db, 'students', student.id)));
    await Promise.all(promises);
  };

  return (
    <DataContext.Provider value={{ studentsList, addStudents, updateStudent, deleteStudent, deleteStudentsByBranch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);
