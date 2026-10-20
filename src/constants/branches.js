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
