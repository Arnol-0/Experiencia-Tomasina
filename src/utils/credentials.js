/**
 * ============================================================================
 * UTILIDAD: credentials (Estado de Credenciales del Estudiante)
 * ============================================================================
 *
 * 📌 PRINCIPIO SOLID: SRP (Single Responsibility Principle)
 * Centraliza la lectura y la construcción del bloque `credentials` que se
 * guarda en el documento del estudiante dentro de Firestore.
 *
 * 📌 FORMATO PERSISTIDO (students/{id}.credentials):
 * {
 *   lanyard:  { delivered: true, deliveredAt: '2026-10-21T...', deliveredBy: 'correo@ust.cl' },
 *   passport: { delivered: true, deliveredAt: '2026-10-21T...', deliveredBy: 'correo@ust.cl' }
 * }
 *
 * 📌 ¿POR QUÉ SE GUARDA ASÍ?
 * - `delivered` es el interruptor de estado que la interfaz lee para pintar
 *   el check verde permanente.
 * - `deliveredAt` y `deliveredBy` dejan trazabilidad de QUIÉN y CUÁNDO
 *   entregó cada credencial (auditoría, igual que `unlockRecords` de los pines).
 */

import { CREDENTIALS } from '../constants/credentials.js';

/**
 * 1. ¿Este estudiante ya recibió la credencial indicada?
 * @param {Object} student - Documento del estudiante (con `credentials`).
 * @param {string} credentialId - Id de la credencial (ver CREDENTIALS).
 * @returns {boolean}
 */
export const isCredentialDelivered = (student, credentialId) =>
  Boolean(student?.credentials?.[credentialId]?.delivered);

/**
 * 2. Devuelve el registro completo de una credencial (o null si no existe).
 */
export const getCredentialRecord = (student, credentialId) =>
  student?.credentials?.[credentialId] || null;

/**
 * 3. Lista de credenciales ya entregadas (ids).
 */
export const getDeliveredCredentials = (student) =>
  Object.keys(CREDENTIALS).filter(id => isCredentialDelivered(student, id));

/**
 * 4. Construye el nuevo mapa de credenciales al registrar una entrega.
 *
 * 📌 IMPORTANTE: devuelve el mapa COMPLETO (incluyendo las credenciales
 * previas) porque Firestore hace merge a nivel de documento, no de campo
 * anidado: si se enviara sólo la credencial nueva, se borrarían las demás.
 *
 * @param {Object} student - Documento actual del estudiante.
 * @param {string} credentialId - Credencial que se acaba de entregar.
 * @param {string} deliveredBy - Correo o nombre de quien realizó la entrega.
 * @returns {Object} Mapa `credentials` listo para persistir.
 */
export const buildCredentialsMap = (student, credentialId, deliveredBy) => ({
  ...(student?.credentials || {}),
  [credentialId]: {
    delivered: true,
    deliveredAt: new Date().toISOString(),
    deliveredBy: deliveredBy || 'desconocido'
  }
});
