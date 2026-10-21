/**
 * ============================================================================
 * CONSTANTES: Catálogo de Credenciales Institucionales
 * ============================================================================
 *
 * 📌 PRINCIPIO SOLID: SRP (Single Responsibility Principle)
 * Este archivo centraliza la definición de los objetos físicos que la DAE
 * entrega al estudiante (lanyard/credencial y pasaporte), junto con el ícono
 * que representa a cada uno. Evita que cada componente invente su propia
 * etiqueta o su propio ícono, y da un único lugar donde agregar nuevas
 * credenciales en el futuro (por ejemplo, "Credencial de biblioteca").
 */

/**
 * Identificadores de las credenciales.
 * 📌 Estos valores son las CLAVES persistidas en Firestore dentro del
 * documento del estudiante (`students/{id}.credentials.{id}`), por lo que
 * nunca deben cambiarse: cambiar un id perdería el historial ya registrado.
 */
export const CREDENTIALS = {
  LANYARD: 'lanyard',
  PASSPORT: 'passport'
};

/**
 * Catálogo de credenciales entregables a un estudiante.
 *
 * 📌 Cada entrada describe UNA credencial:
 * - id:          clave persistida en Firestore (ver CREDENTIALS).
 * - label:       nombre visible para el usuario.
 * - description: texto explicativo para el tooltip y la interfaz.
 * - icon:        nombre del ícono de lucide-react (ver CredentialButton.jsx).
 */
export const CREDENTIAL_CATALOG = [
  {
    id: CREDENTIALS.LANYARD,
    label: 'Lanyard',
    description: 'Credencial institucional con el código del estudiante',
    icon: 'IdCard'
  },
  {
    id: CREDENTIALS.PASSPORT,
    label: 'Pasaporte',
    description: 'Pasaporte de estudiante para viajes e intercambios',
    icon: 'BookUser'
  }
];
