/**
 * ============================================================================
 * CONSTANTES: Plantillas Excel de importación
 * ============================================================================
 *
 * 📌 SRP (Single Responsibility Principle):
 * Centraliza la definición de las plantillas descargables. Si mañana cambia el
 * nombre de un archivo o se agrega una nueva plantilla, se modifica solo aquí.
 *
 * Los archivos viven en `public/plantillas/`, por lo que Vite los sirve tal cual
 * (en desarrollo y en el build de producción) sin pasar por el bundler.
 */

const BASE = import.meta.env.BASE_URL || '/';

/** 📌 Construye la URL pública de un archivo dentro de `public/plantillas/`. */
const templateUrl = (fileName) => `${BASE}plantillas/${fileName}`.replace(/\/{2,}/g, '/');

export const TEMPLATES = [
  {
    id: 'students',
    label: 'Plantilla de Estudiantes',
    description: 'RUT, Nombre, Carrera, Jornada, Institución y Sede',
    fileName: 'Plantilla_Estudiantes.xlsx',
    url: templateUrl('Plantilla_Estudiantes.xlsx'),
  },
  {
    id: 'pins',
    label: 'Plantilla de Pines y Credenciales',
    description: 'RUT + Sede + Lanyard + Pasaporte + Pines a lo largo',
    fileName: 'Plantilla_Pines.xlsx',
    url: templateUrl('Plantilla_Pines.xlsx'),
  },
];
