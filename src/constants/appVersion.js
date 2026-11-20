/**
 * ============================================================================
 * CONSTANTE: Versión de la Aplicación y Changelog
 * ============================================================================
 *
 * 📌 Centraliza la versión actual de la app y el historial de cambios visibles
 * al usuario. Cuando subas una nueva versión, actualiza APP_VERSION y agrega
 * una entrada nueva al inicio de CHANGELOG con la fecha y la lista de mejoras.
 *
 * La notificación de nueva versión se muestra durante 2 horas desde el primer
 * ingreso del usuario tras la actualización (controlado por localStorage).
 */

export const APP_VERSION = '1.2';

/**
 * Duración de la ventana de notificación en milisegundos (2 horas)
 */
export const VERSION_NOTICE_DURATION_MS = 2 * 60 * 60 * 1000;

/**
 * Changelog: lista de cambios por versión.
 * Solo la versión actual se muestra en la notificación de actualización.
 */
export const CHANGELOG = [
  {
    version: '1.2',
    date: '20 de Noviembre, 2026',
    title: 'Termo Tomasino, Gestión de Pines y Mejoras DAE',
    changes: [
      {
        icon: '🧉',
        text: 'Nuevo Termo Tomasino: se llena progresivamente con cada pin obtenido hasta alcanzar la meta de 7 pines.'
      },
      {
        icon: '🎉',
        text: 'Celebración al 7° pin: notificación animada al centro de la pantalla cuando un estudiante desbloquea su séptimo pin.'
      },
      {
        icon: '🔓',
        text: 'Gestión avanzada de pines: Admin, Coordinador y Director DAE pueden bloquear, desbloquear y mover pines directamente.'
      },
      {
        icon: '👤',
        text: 'Soporte completo para Director DAE: el sistema ahora reconoce todas las variantes del rol sin importar el formato en la base de datos.'
      },
      {
        icon: '📷',
        text: 'Búsqueda mejorada con escáner: soporte optimizado para pistola de escaneo de carnet/cédula de identidad (QR y código de barras).'
      },
      {
        icon: '⚡',
        text: 'Feedback visual de errores: si una operación falla, ahora se muestra un mensaje claro en pantalla en vez de fallar silenciosamente.'
      }
    ]
  },
  {
    version: '1.1',
    date: 'Octubre, 2026',
    title: 'Lanzamiento Inicial',
    changes: [
      {
        icon: '🚀',
        text: 'Panel de administración, directorio de estudiantes y sistema de pines formativos.'
      }
    ]
  }
];
