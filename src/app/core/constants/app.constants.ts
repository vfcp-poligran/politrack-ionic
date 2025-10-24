export const APP_CONSTANTS = {
  // Configuración de historial
  HISTORY: {
    MAX_HISTORY: 10,
    STORAGE_KEY: 'politrack_history',
    BATCH_SIZE: 5
  },

  // Configuración de backup
  BACKUP: {
    VERSION: 1.0,
    DATE_FORMAT: 'yyyy-MM-dd_HH:mm:ss',
    PREFIX: 'politrack_backup_',
    ENCRYPTION: false
  },

  // Configuración de evaluación
  EVALUATION: {
    MAX_COMMENT_LENGTH: 500,
    MAX_CRITERIA: 10,
    MAX_STUDENTS_PER_BATCH: 100,
    MIN_SCORE: 0,
    MAX_SCORE: 100,
    TYPES: ['INDIVIDUAL', 'PG_PI'] as const
  },

  // Configuración de UI
  UI: {
    DEBOUNCE_TIME: 300,
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 2500,
    BREAKPOINT_MOBILE: 480,
    BREAKPOINT_TABLET: 768,
    BREAKPOINT_DESKTOP: 1024
  },

  // Validaciones
  VALIDATION: {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_REGEX: /^\+?[\d\s\-()]{7,}$/,
    MIN_PASSWORD_LENGTH: 8
  },

  // Mensajes
  MESSAGES: {
    ERROR_LOAD_CURSOS: 'No se pudieron cargar los cursos',
    ERROR_SAVE_EVALUACION: 'Error guardando evaluación',
    SUCCESS_IMPORT: 'Importación completada exitosamente',
    SUCCESS_EXPORT: 'Datos exportados correctamente',
    CONFIRM_DELETE: '¿Está seguro de eliminar?'
  }
};

/**
 * Claves de almacenamiento
 */
export const STORAGE_KEYS = {
  CURSOS: 'cursos',
  EVALUACIONES: 'evaluaciones',
  COMENTARIOS: 'comentarios_comunes',
  RUBRICAS: 'rubricas',
  UI_STATE: 'ui_state',
  USER_PREFERENCES: 'user_prefs'
};

/**
 * Temas disponibles
 */
export const THEMES = ['light', 'dark', 'auto'] as const;
export type Theme = typeof THEMES[number];
