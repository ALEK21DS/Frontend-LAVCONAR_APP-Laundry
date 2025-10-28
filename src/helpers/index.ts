/**
 * Archivo barrel para exportar todos los helpers
 * Facilita las importaciones en otros archivos
 */

// Manejo de errores de axios
export { extractAxiosError, handleApiError } from './axios-error.helper';

// Instancia de axios autenticada
export * from './axios-instance.helper';

// Formateadores de datos
export {
  formatPhone,
  formatDate,
  formatDateTime,
  formatDateOnly,
  formatCurrency,
  formatGuideNumber,
  capitalizeFirst,
  truncateText,
} from './formatters.helper';

// Traducciones de enums
export {
  translateEnum,
  translateEnumArray,
  getEnumTranslations,
  getEnumOptions,
  // Constantes de traducciones
  SERVICE_TYPE_TRANSLATIONS,
  CHARGE_TYPE_TRANSLATIONS,
  GENERAL_CONDITION_TRANSLATIONS,
  GUIDE_STATUS_TRANSLATIONS,
  GARMENT_TYPE_TRANSLATIONS,
  PREDOMINANT_COLOR_TRANSLATIONS,
  SERVICE_PRIORITY_TRANSLATIONS,
  WASHING_TYPE_TRANSLATIONS,
  REQUESTED_SERVICE_TRANSLATIONS,
  PROCESS_TYPE_TRANSLATIONS,
  PROCESS_STATUS_TRANSLATIONS,
  SPECIAL_TREATMENT_TRANSLATIONS,
  WASH_TEMPERATURE_TRANSLATIONS,
  MACHINE_TYPE_TRANSLATIONS,
  MACHINE_STATUS_TRANSLATIONS,
  GARMENT_STATE_TRANSLATIONS,
  INCIDENT_TYPE_TRANSLATIONS,
  INCIDENT_STATUS_TRANSLATIONS,
  ACTION_TAKEN_TRANSLATIONS,
  NOTIFICATION_TYPE_TRANSLATIONS,
  NOTIFICATION_STATUS_TRANSLATIONS,
  STATUS_TRANSLATIONS,
  ROLES_TRANSLATIONS,
  AUDIT_ACTION_TRANSLATIONS,
  ENTITY_TRANSLATIONS,
} from './enum-translations';

// Mapeadores de estado (específicos de la app móvil)
export {
  mapGuideStatusToBackend,
  mapGuideStatusToMobile,
  mapGeneralCondition,
  mapServiceType,
  mapChargeType,
} from './status-mapper.helper';

// Validadores
export {
  // Validaciones genéricas
  validateEmail,
  validatePhone,
  validateRequired,
  validateMinLength,
  validateMaxLength,
  // Validaciones numéricas
  isValidInteger,
  isValidDecimal,
  isPositive,
  isNonNegative,
  safeParseInt,
  safeParseFloat,
  // Sanitización
  sanitizeNumericInput,
  sanitizeDecimalInput,
  // Validaciones de fechas
  isValidDate,
  // Validaciones de formularios completos
  validateClientData,
  validateLoginData,
  type ValidationResult,
} from './validators.helper';

// Supresor de errores
export {
  initializeErrorSuppressor,
  restoreConsole,
} from './error-suppressor.helper';

