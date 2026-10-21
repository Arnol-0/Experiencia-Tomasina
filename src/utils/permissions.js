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
 * 1. ¿El rol recibido es coordinador?
 */
export const isCoordinator = (user) => user?.role === ROLES.COORDINATOR;

/**
 * 2. ¿El rol recibido es administrador del sistema?
 */
export const isAdmin = (user) => user?.role === ROLES.ADMIN;

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
  if (role === ROLES.COORDINATOR || role === ROLES.ADMIN) {
    return NATIONAL_BRANCH;
  }
  return String(branch || '').trim();
};

/**
 * 7. ¿Este usuario puede administrar (crear/editar/borrar) estudiantes?
 */
export const canManageStudents = (user) =>
  user?.role === ROLES.ADMIN ||
  user?.role === ROLES.COORDINATOR ||
  user?.role === ROLES.DIRECTOR;

/**
 * 8. ¿Este usuario puede desbloquear pines en el perfil de un estudiante?
 */
export const canUnlockPins = (user) =>
  user?.role === ROLES.ADMIN ||
  user?.role === ROLES.COORDINATOR ||
  user?.role === ROLES.DIRECTOR;
