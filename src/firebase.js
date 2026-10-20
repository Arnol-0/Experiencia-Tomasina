import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyACzQIprPX-tYOrealZCAIu-gmWxjN6BZY",
  authDomain: "tuviajest.firebaseapp.com",
  databaseURL: "https://tuviajest-default-rtdb.firebaseio.com",
  projectId: "tuviajest",
  storageBucket: "tuviajest.firebasestorage.app",
  messagingSenderId: "723862074013",
  appId: "1:723862074013:web:964ecd25b43fadabb49a74",
  measurementId: "G-ZWGB7WELSQ"
};

// 1. Inicialización de la aplicación Firebase
const app = initializeApp(firebaseConfig);

// 2. Instancia de Autenticación
export const auth = getAuth(app);

/**
 * ============================================================================
 * CONFIGURACIÓN DE FIRESTORE CON PERSISTENCIA OFFLINE
 * ============================================================================
 * 
 * 📌 ¿QUÉ HACE ESTA CONFIGURACIÓN?
 * Habilita el almacenamiento en caché local (IndexedDB del navegador) para Firestore.
 * Con `persistentMultipleTabManager()`, múltiples pestañas abiertas comparten la misma
 * caché local de manera coordinada sin conflictos.
 * 
 * 📌 BENEFICIOS:
 * 1. Resiliencia Offline: Si falla el WiFi en la sede universitaria, la aplicación
 *    sigue funcionando, leyendo datos desde la caché local y encolando las escrituras.
 * 2. Sincronización Automática: Tan pronto vuelve la conexión a Internet, Firebase
 *    sincroniza en segundo plano todos los cambios pendientes con la nube.
 * 3. Rendimiento Ultrarrápido: Las lecturas iniciales se sirven instantáneamente
 *    desde la memoria caché del navegador.
 */
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

