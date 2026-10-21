/**
 * ============================================================================
 * CONSTANTES: Catálogo Oficial de Sedes Santo Tomás
 * ============================================================================
 * 
 * 📌 PRINCIPIO SOLID: SRP (Single Responsibility Principle)
 * Este archivo centraliza la lista y agrupación geográfica de todas las sedes
 * a lo largo de Chile, evitando duplicidad de código en modales, formularios
 * y consultas de Firestore.
 */

export const branchOptions = [
  {
    label: 'Zona Norte',
    options: ['Arica', 'Iquique', 'Antofagasta', 'Copiapó']
  },
  {
    label: 'Zona Centro',
    options: ['La Serena', 'Ovalle', 'Viña del Mar', 'Rancagua', 'Curicó', 'Talca']
  },
  {
    label: 'Región Metropolitana',
    options: ['UST Santiago (Av. Ejército Libertador)', 'Santiago Centro (Vergara)', 'San Joaquín', 'Puente Alto']
  },
  {
    label: 'Zona Sur y Austral',
    options: ['Chillán', 'Concepción', 'Los Ángeles', 'Temuco', 'Valdivia', 'Osorno', 'Puerto Montt', 'Punta Arenas']
  },
  {
    label: 'Modalidad Virtual',
    options: ['Sede Online']
  }
];

// Lista plana ordenada con todos los nombres de sedes
export const ALL_BRANCHES = branchOptions.flatMap(group => group.options);

/**
 * Sede virtual que representa el alcance NACIONAL (todas las sedes del país).
 *
 * 📌 ¿POR QUÉ EXISTE?
 * El rol 'coordinador' es, por definición, nacional: su trabajo es acompañar
 * a todas las sedes, no a una en particular. Por eso NO se le fuerza una sede
 * concreta al momento de crear su cuenta ni de completar su perfil: se le
 * asigna automáticamente este valor para que quede explícito en Firestore y
 * que los filtros por sede lo reconozcan como "ver todo".
 */
export const NATIONAL_BRANCH = 'Todas las Sedes';

// Etiquetas equivalentes que se aceptan como alcance nacional (normalización)
export const NATIONAL_BRANCH_ALIASES = ['todas', 'todas las sedes', 'nacional'];
