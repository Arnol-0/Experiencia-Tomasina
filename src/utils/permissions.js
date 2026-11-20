/**
 * ============================================================================
 * UTILIDAD: permissions (Alcance y Roles del Usuario)
 * ============================================================================
 *
 * 📌 PRINCIPIO SOLID: SRP (Single Responsibility Principle)
 * Este archivo centraliza las preguntas "quién es" y "hasta dónde llega" un
 * usuario dentro de la aplicación, evitando que cada página repita (y a veces
 * contradiga) la lógica de roles.
 *
 * 📌 REGLA DE NEGOCIO CENTRAL:
 * El rol 'coordinador' es NACIONAL por definición: opera sobre todas las sedes
 * del país y por eso NUNCA se le asigna una sede concreta. El rol 'admin'
 * también es nacional. Los roles 'director_dae' y 'asistente_dae' sí operan
 * sobre su propia sede.
 */

import { NATIONAL_BRANCH, NATIONAL_BRANCH_ALIASES } from '../constants/branches.js';

export const ROLES = {
  ADMIN: 'admin',
  COORDINATOR: 'coordinador',
  DIRECTOR: 'director_dae',
  ASSISTANT: 'asistente_dae'
};

/**
 * Normaliza el nombre de una sede para comparaciones seguras.
 */
const normalizeBranch = (branch) => String(branch || '').trim().toLowerCase();

/**
 * Extrae y normaliza el rol del usuario desde cualquier campo posible
 * (role, rol, userRole, tipo) y cualquier variante de string.
 * Devuelve un string limpio en minúsculas, sin acentos, sin espacios (reemplazados por _).
 *
 * Ejemplos:
 *   "Director DAE"  → "director_dae"
 *   "director"      → "director"
 *   "Director"      → "director"
 *   "DIRECTOR_DAE"  → "director_dae"
 *   "coordinador"   → "coordinador"
 *   "Asistente DAE" → "asistente_dae"
 *   "admin"         → "admin"
 */
export const extractRole = (user) => {
  if (!user) return '';
  const raw = user.role || user.rol || user.userRole || user.tipo || '';
  if (typeof raw !== 'string') return '';
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // quitar acentos
    .replace(/[\s-]+/g, '_');          // espacios/guiones → underscore
};

/**
 * 1. ¿El rol recibido es coordinador?
 */
export const isCoordinator = (user) => {
  const r = extractRole(user);
  return r === ROLES.COORDINATOR || r.includes('coordinador') || r.includes('coord');
};

/**
 * 2. ¿El rol recibido es administrador del sistema?
 */
export const isAdmin = (user) => {
  const r = extractRole(user);
  return r === ROLES.ADMIN || r.includes('admin');
};

/**
 * 2b. ¿El rol recibido es Director DAE?
 * Detecta: 'director_dae', 'director', 'Director DAE', 'Director', 'dae', etc.
 */
export const isDirector = (user) => {
  const r = extractRole(user);
  return r === ROLES.DIRECTOR || r === 'director' || r.includes('director') || r === 'dae';
};

/**
 * 2c. ¿El rol recibido es Asistente DAE?
 */
export const isAssistant = (user) => {
  const r = extractRole(user);
  return r === ROLES.ASSISTANT || r.includes('asistente');
};

/**
 * 3. ¿Este usuario tiene alcance NACIONAL (ve todas las sedes)?
 *
 * - admin           -> siempre nacional
 * - coordinador     -> nacional cuando no tiene una sede concreta asignada
 *                      (o cuando su sede es explícitamente "Todas las Sedes")
 * - director/asistente -> nunca nacional
 */
export const isNationalScope = (user) => {
  if (isAdmin(user)) return true;
  if (!isCoordinator(user)) return false;

  const branch = normalizeBranch(user?.branch);
  if (!branch) return true;
  return NATIONAL_BRANCH_ALIASES.includes(branch);
};

/**
 * Helper interno: ¿el rol normalizado del usuario coincide con alguno de los dados?
 */
const hasAnyRole = (user, ...checkers) => checkers.some(fn => fn(user));

/**
 * 4. ¿Esta SEDE (como texto) representa el alcance nacional?
 * Se usa para excluir del desglose por sede a los usuarios/alumnos
 * que están asignados a "todas las sedes".
 */
export const isNationalScopeBranch = (branch) => {
  const normalized = normalizeBranch(branch);
  if (!normalized) return false;
  return NATIONAL_BRANCH_ALIASES.includes(normalized);
};

/**
 * 5. ¿Este usuario tiene alcance GLOBAL (todas las sedes y acciones nacionales)?
 * Es el helper que deben usar las páginas para decidir si muestran el filtro
 * de sede o las acciones de administración nacional.
 */
export const isGlobalUser = (user) => isNationalScope(user);

/**
 * 6. Devuelve la sede que corresponde asignarle a un usuario según su rol.
 *
 * 📌 El coordinador SIEMPRE recibe el alcance nacional: no se le fuerza
 * una sede concreta, se le asigna 'Todas las Sedes'.
 */
export const resolveBranchForRole = (role, branch) => {
  // Normalizar el rol recibido para manejar variantes ('Director DAE', 'coordinador', etc.)
  const normalized = typeof role === 'string'
    ? role.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[\s-]+/g, '_')
    : '';
  if (normalized === ROLES.COORDINATOR || normalized.includes('coordinador') || normalized.includes('coord') ||
      normalized === ROLES.ADMIN || normalized.includes('admin')) {
    return NATIONAL_BRANCH;
  }
  return String(branch || '').trim();
};

/**
 * 7. ¿Este usuario puede administrar (crear/editar/borrar) estudiantes?
 */
export const canManageStudents = (user) =>
  isAdmin(user) || isCoordinator(user) || isDirector(user);

/**
 * 8. ¿Este usuario puede desbloquear pines en el perfil de un estudiante?
 */
export const canUnlockPins = (user) =>
  isAdmin(user) || isCoordinator(user) || isDirector(user) || isAssistant(user);

/**
 * 9. ¿Este usuario puede entregar/activar credenciales físicas (lanyard, pasaporte)?
 */
export const canDeliverCredentials = (user) =>
  isAdmin(user) || isCoordinator(user) || isDirector(user) || isAssistant(user);

/**
 * 10. ¿Este usuario puede gestionar (bloquear, desbloquear directamente, habilitar o revocar) pines y credenciales?
 * Aplica para Admin, Coordinador y Director DAE.
 */
export const canManagePinStatus = (user) =>
  isAdmin(user) || isCoordinator(user) || isDirector(user);
