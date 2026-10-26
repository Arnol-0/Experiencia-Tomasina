import vcmImg from '../assets/vcm.jpg';
import representantesImg from '../assets/representantes.jpg';
import internacionalImg from '../assets/internacional.jpg';
import orientacionImg from '../assets/Orientacion.jpg';
import liderazgoImg from '../assets/Liderazgo.jpg';
import destacadoImg from '../assets/Destacado.jpeg';
import bienestarImg from '../assets/Bienestar.jpg';
import semana0Img from '../assets/Semana0.jpg';
import proyectosImg from '../assets/Proyectos.jpg';
import articulacionImg from '../assets/Articulacion.jpg';
import voluntariadoImg from '../assets/Voluntariado.jpg';
import centroImg from '../assets/Centro.jpg';

/**
 * ============================================================================
 * CONSTANTES: Catálogo Oficial de Pines Institucionales Santo Tomás
 * ============================================================================
 * 
 * 📌 SRP (Single Responsibility Principle):
 * Centraliza la definición de insignias, requisitos y categorías en un único lugar,
 * desacoplándolo del ciclo de vida de los componentes React.
 */
export const PINS_CATALOG = [
  {
    id: 'pin_ivu',
    name: 'Semana 0/Programa IVU',
    description: 'Programa de Inducción',
    customImage: semana0Img,
    category: 'Inducción',
    requirementText: 'Debe participar a lo menos en 1 taller:',
    options: ['Participar de Semana 0', 'Participar de Progama Ivu'],
  },
  {
    id: 'pin_articulacion',
    name: 'Articulación',
    description: 'Proceso de articulación',
    customImage: articulacionImg,
    category: 'Académico',
    requirementText: 'Requisito:',
    options: ['Matricularse en Programa de Articulacion'],
  },
  {
    id: 'pin_voluntariado',
    name: 'Voluntariado',
    description: 'Acción social comunitaria',
    customImage: voluntariadoImg,
    category: 'Social',
    requirementText: 'Al menos una:',
    options: [
      'Mechoneo Solidario',
      'Voluntariado Permanente',
      'Trabajos Voluntariados de Invierno',
      'Trabajo Voluntariados de Verano',
    ],
  },
  {
    id: 'pin_proyectos',
    name: 'Proyectos Estudiantiles',
    description: 'Iniciativas y fondos',
    customImage: proyectosImg,
    category: 'Desarrollo',
    requirementText: 'Al menos Una:',
    options: [
      'Adjudicar Fondos Concursables de la DAE',
      'Pasar a semifinal Mercado E',
      'Participar en concurso inserción en Lineas de Investigacion UST',
    ],
  },
  {
    id: 'pin_bienestar',
    name: 'Bienestar',
    description: 'Salud mental y física',
    customImage: bienestarImg,
    category: 'Salud',
    requirementText: 'Al menos una:',
    options: [
      'Taller Proposito de Vida',
      'Capacitacion en primera ayuda Psicologica (Certificado)',
      'Talleres DAE (3 ciclos de talleres, 70% de asistencia)',
    ],
  },
  {
    id: 'pin_centro_aprendizaje',
    name: 'Centro de Aprendizaje',
    description: 'Apoyo y tutorías',
    customImage: centroImg,
    category: 'Académico',
    requirementText: 'Participar de 6 o mas sesiones:',
    options: ['Talleres y tutorias del centro de aprendizaje'],
  },
  {
    id: 'pin_liderazgo',
    name: 'Programa de Liderazgo',
    description: 'Escuela de formación',
    customImage: liderazgoImg,
    category: 'Liderazgo',
    requirementText: 'Al menos una:',
    options: [
      'Escuela de Lideres',
      'Programa Fortaleciendo el Rol de los Representantes Estudiantiles',
    ],
  },
  {
    id: 'pin_orientacion',
    name: 'Orientación Profesional',
    description: 'Acompañamiento laboral',
    customImage: orientacionImg,
    category: 'Desarrollo',
    requirementText: 'Al menos una:',
    options: [
      'Participar al menos en el 70% de las actividades de la ruta de preparacion hacia el trabajo',
      'Programa de orientación Profesional y Emprendimiento (minimo 2 asignaturas)',
    ],
  },
  {
    id: 'pin_destacado',
    name: 'Estudiante Destacado/a',
    description: 'Reconocimiento al mérito',
    customImage: destacadoImg,
    category: 'Reconocimiento',
    requirementText: 'Al menos una:',
    options: ['Beca Excelencia Académica', 'Premio Sello Santo Tomas'],
  },
  {
    id: 'pin_representante',
    name: 'Representantes Tomasin@s',
    description: 'Vocería estudiantil',
    customImage: representantesImg,
    category: 'Liderazgo',
    requirementText: 'Al menos Una:',
    options: [
      'Torneo de debates',
      'Cápitan de selecciones de ST o Deportista destacado',
      'Participar de Organizaciones estudiantiles',
      'Representante Estudiantil en comité CEDI',
      'Estudiante Lider o Herman@ Tomasin@ (al menos 1 semestre)',
      'Mentor del Programa de Mentoring Inclusivo',
      'Mentor del Programa de Mentoring Vespertino',
      'Mentor del Programa de Mentoring Socioafectivo',
      'Estudiante que desarrolla talleres DAE (ciclo completo)',
      'Formar parte del Team Admision',
    ],
  },
  {
    id: 'pin_internacional',
    name: 'Experiencia Internacional',
    description: 'Intercambio y movilidad',
    customImage: internacionalImg,
    category: 'Desarrollo',
    requirementText: 'Al menos una:',
    options: [
      'Experiencia de intercambio internacional',
      'Programas en China del Instituto Confucio',
      'Curso de chino mandarín básico 1',
    ],
  },
  {
    id: 'pin_vcm',
    name: 'Vinculación con el Medio',
    description: 'Impacto en el entorno',
    customImage: vcmImg,
    category: 'Social',
    requirementText: 'Al menos una:',
    options: [
      'Aprobar asignatura A+S',
      'Adjudicar proyecto de innovacion social Vcm',
      'Participar en los Programas Institucionales de VcM',
    ],
  },
];

export default PINS_CATALOG;
