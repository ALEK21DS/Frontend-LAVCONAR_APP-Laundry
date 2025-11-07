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

