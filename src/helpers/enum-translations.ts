/**
 * Traducciones centralizadas para todos los enums del sistema
 * Basado en el esquema de Prisma y el backend
 */

type Dictionary = Record<string, string>;

// TIPOS DE SERVICIO
export const SERVICE_TYPE_TRANSLATIONS: Dictionary = {
  INDUSTRIAL: "Industrial",
  PERSONAL: "Personal",
};

// TIPOS DE COBRO
export const CHARGE_TYPE_TRANSLATIONS: Dictionary = {
  BY_WEIGHT: "Por peso",
  BY_GARMENT: "Por prenda",
  BY_UNIT: "Por unidad",
  MIXED: "Mixto",
};

// CONDICIÓN GENERAL
export const GENERAL_CONDITION_TRANSLATIONS: Dictionary = {
  EXCELLENT: "Excelente",
  GOOD: "Buena",
  REGULAR: "Regular",
  POOR: "Deficiente",
  DAMAGED: "Dañado",
};

// ESTADOS DE GUÍA
export const GUIDE_STATUS_TRANSLATIONS: Dictionary = {
  // SERVICIO PERSONAL
  SENT: "Enviada",
  IN_PROCESS: "En Proceso",
  WASHING: "En Lavado",
  DRYING: "En Secado",
  IRONING: "En Planchado",
  FOLDING: "Doblada",
  PACKAGING: "Empaquetada",
  LOADING: "En Carga",
  RECEIVED_AT_LOCAL: "Recibida en Local",
  DELIVERED_TO_CUSTOMER: "Entregada al Cliente",

  // SERVICIO INDUSTRIAL
  COLLECTED: "Recolectada",
  IN_TRANSIT: "En Tránsito",
  RECEIVED: "Recibida",
  RECEIVED_AT_PLANT: "Recibida en Planta",
  IN_PROCESS_INDUSTRIAL: "En Proceso",
  WASHING_INDUSTRIAL: "En Lavado",
  DRYING_INDUSTRIAL: "En Secado",
  PACKAGING_INDUSTRIAL: "Empaquetada",
  SHIPPING: "En Embarque",
  LOADING_INDUSTRIAL: "En Carga",
  COMPLETED: "Completada",
  FINISHED: "Terminada",
  DELIVERED: "Entregada",
};

// TIPOS DE PRENDA
export const GARMENT_TYPE_TRANSLATIONS: Dictionary = {
  UNIFORMS: "Uniformes",
  SHEETS: "Sábanas",
  TOWELS: "Toallas",
  TABLECLOTHS: "Manteles",
  CURTAINS: "Cortinas",
  MATS: "Tapetes",
  OTHER: "Otros",
};

// COLORES PREDOMINANTES
export const PREDOMINANT_COLOR_TRANSLATIONS: Dictionary = {
  WHITE: "Blanco",
  LIGHT_COLORS: "Colores claros",
  DARK_COLORS: "Colores oscuros",
  MIXED: "Mixto",
};

// PRIORIDAD DE SERVICIO
export const SERVICE_PRIORITY_TRANSLATIONS: Dictionary = {
  NORMAL: "Normal",
  URGENT: "Urgente",
  EXPRESS: "Exprés",
};

// TIPOS DE LAVADO
export const WASHING_TYPE_TRANSLATIONS: Dictionary = {
  WASH_DRY: "Lavar y Secar",
  WASH_IRON: "Lavar y Planchar",
  IRON_ONLY: "Solo Planchar",
  STAIN_REMOVAL: "Remoción de Manchas",
  SEWING: "Costura",
  BLEACH: "Blanqueo",
  SHOES: "Zapatos",
  REPROCESS: "Reprocesar",
};

// SERVICIOS SOLICITADOS
export const REQUESTED_SERVICE_TRANSLATIONS: Dictionary = {
  WASH: "Lavado",
  DRY: "Secado",
  IRON: "Planchado",
  CLEAN: "Limpieza",
};

// TIPOS DE PROCESO
export const PROCESS_TYPE_TRANSLATIONS: Dictionary = {
  WASHING: "Lavado",
  DRYING: "Secado",
  IRONING: "Planchado",
  DRY_CLEANING: "Lavado en Seco",
};

// ESTADOS DE PROCESO
export const PROCESS_STATUS_TRANSLATIONS: Dictionary = {
  PENDING: "Pendiente",
  IN_PROGRESS: "En Progreso",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
  FAILED: "Fallido",
};

// TRATAMIENTOS ESPECIALES
export const SPECIAL_TREATMENT_TRANSLATIONS: Dictionary = {
  NONE: "Ninguno",
  STAIN_REMOVAL: "Remoción de Manchas",
  DELICATE: "Delicado",
  HEAVY_DUTY: "Uso Pesado",
  DISINFECTION: "Desinfección",
  NORMAL: "Normal",
};

// TEMPERATURAS DE LAVADO
export const WASH_TEMPERATURE_TRANSLATIONS: Dictionary = {
  COLD: "Frío (20°C)",
  WARM: "Tibio (40°C)",
  HOT: "Caliente (60°C)",
  VERY_HOT: "Muy Caliente (90°C)",
};

// TIPOS DE MÁQUINA
export const MACHINE_TYPE_TRANSLATIONS: Dictionary = {
  WASHER: "Lavadora",
  DRYER: "Secadora",
};

// ESTADOS DE MÁQUINA
export const MACHINE_STATUS_TRANSLATIONS: Dictionary = {
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  MAINTENANCE: "En Mantenimiento",
  OUT_OF_SERVICE: "Fuera de Servicio",
};

// ESTADOS DE PRENDA
export const GARMENT_STATE_TRANSLATIONS: Dictionary = {
  COLLECTED: "Recolectado",
  IN_TRANSIT: "En tránsito",
  RECEIVED: "Recibido",
  WASHING: "En lavado",
  DRYING: "En secado",
  FOLDING: "Doblado",
  IRONING: "En planchado",
  READY_DELIVERY: "Listo para entrega",
  DELIVERED: "Entregado",
};

// TIPOS DE INCIDENTE
export const INCIDENT_TYPE_TRANSLATIONS: Dictionary = {
  DAMAGE: "Daño",
  LOSS: "Pérdida",
  STAIN: "Mancha",
  STAIN_NOT_REMOVED: "Mancha No Removida",
  QUALITY_ISSUE: "Problema de Calidad",
  DELAY: "Retraso",
  MISSING: "Faltante",
  EXTRA: "Extra",
  OTHER: "Otro",
};

// ESTADOS DE INCIDENTE
export const INCIDENT_STATUS_TRANSLATIONS: Dictionary = {
  OPEN: "Abierto",
  PENDING: "Pendiente",
  IN_PROGRESS: "En Proceso",
  RESOLVED: "Resuelto",
  COMPENSATED: "Compensado",
  CLOSED: "Cerrado",
};

// ACCIONES TOMADAS
export const ACTION_TAKEN_TRANSLATIONS: Dictionary = {
  COMPENSATION: "Compensación",
  REPLACEMENT: "Reemplazo",
  REPAIR: "Reparación",
  REFUND: "Reembolso",
  NEW_PURCHASE: "Nueva Compra",
  REWASH: "Relavado",
  NONE: "Ninguna",
};

// TIPOS DE NOTIFICACIÓN
export const NOTIFICATION_TYPE_TRANSLATIONS: Dictionary = {
  MANUAL: "Manual",
  GARMENT_STATE_CHANGE: "Cambio de Estado de Prenda",
  WASHING_PROCESS: "Proceso de Lavado",
  INCIDENT: "Incidente",
  GUIDE_STATUS: "Estado de Guía",
};

// ESTADOS DE NOTIFICACIÓN
export const NOTIFICATION_STATUS_TRANSLATIONS: Dictionary = {
  SENT: "Enviado",
  FAILED: "Fallido",
  PENDING: "Pendiente",
};

// ESTADOS ACTIVO/INACTIVO
export const STATUS_TRANSLATIONS: Dictionary = {
  ACTIVE: "Activo",
  INACTIVE: "Inactivo",
};

// ROLES
export const ROLES_TRANSLATIONS: Dictionary = {
  SUPERADMIN: "Super Administrador",
  ADMIN: "Administrador",
  USER: "Usuario",
};

// ACCIONES DE AUDITORÍA
export const AUDIT_ACTION_TRANSLATIONS: Dictionary = {
  CREATE: "Crear",
  CREATED: "Creado",
  UPDATE: "Actualizar",
  UPDATED: "Actualizado",
  DELETE: "Eliminar",
  DELETED: "Eliminado",
  SCAN: "Escanear",
  SCANNED: "Escaneado",
  COMPLETE: "Completar",
  COMPLETED: "Completado",
  START: "Iniciar",
  STARTED: "Iniciado",
  LOGIN: "Iniciar Sesión",
  LOGOUT: "Cerrar Sesión",
  PASSWORD_RESET: "Restablecer Contraseña",
  FAILED_LOGIN: "Inicio de Sesión Fallido",
  PASSWORD_CHANGED: "Contraseña Cambiada",
  TOKEN_REFRESH: "Actualizar Token",
  SESSION_EXPIRED: "Sesión Expirada",
};

// ENTIDADES DEL SISTEMA (para auditorías)
export const ENTITY_TRANSLATIONS: Dictionary = {
  CLIENT: "Cliente",
  CLIENTS: "Cliente",
  GUIDE: "Guía",
  GUIDES: "Guía",
  GARMENT: "Prenda",
  GARMENTS: "Prenda",
  PROCESS: "Proceso",
  PROCESSES: "Proceso",
  TAG: "Tag RFID",
  TAGS: "Tag RFID",
  USER: "Usuario",
  USERS: "Usuario",
  BRANCH_OFFICE: "Sucursal",
  BRANCH_OFFICES: "Sucursal",
  AUTHORIZATION_REQUEST: "Solicitud de autorización",
  AUTHORIZATION_REQUESTS: "Solicitud de autorización",
  VEHICLE: "Vehículo",
  VEHICLES: "Vehículo",
  MACHINE: "Máquina",
  MACHINES: "Máquina",
};

// Objeto con todas las traducciones para facilitar el acceso
const ENUM_TRANSLATIONS = {
  service_type: SERVICE_TYPE_TRANSLATIONS,
  charge_type: CHARGE_TYPE_TRANSLATIONS,
  general_condition: GENERAL_CONDITION_TRANSLATIONS,
  guide_status: GUIDE_STATUS_TRANSLATIONS,
  status: GUIDE_STATUS_TRANSLATIONS,
  garment_type: GARMENT_TYPE_TRANSLATIONS,
  predominant_color: PREDOMINANT_COLOR_TRANSLATIONS,
  service_priority: SERVICE_PRIORITY_TRANSLATIONS,
  washing_type: WASHING_TYPE_TRANSLATIONS,
  requested_service: REQUESTED_SERVICE_TRANSLATIONS,
  process_type: PROCESS_TYPE_TRANSLATIONS,
  process_status: PROCESS_STATUS_TRANSLATIONS,
  special_treatment: SPECIAL_TREATMENT_TRANSLATIONS,
  wash_temperature: WASH_TEMPERATURE_TRANSLATIONS,
  machine_type: MACHINE_TYPE_TRANSLATIONS,
  machine_status: MACHINE_STATUS_TRANSLATIONS,
  garment_state: GARMENT_STATE_TRANSLATIONS,
  garment_state_type: GARMENT_STATE_TRANSLATIONS,
  incident_type: INCIDENT_TYPE_TRANSLATIONS,
  incident_status: INCIDENT_STATUS_TRANSLATIONS,
  action_taken: ACTION_TAKEN_TRANSLATIONS,
  notification_type: NOTIFICATION_TYPE_TRANSLATIONS,
  notification_status: NOTIFICATION_STATUS_TRANSLATIONS,
  active_inactive: STATUS_TRANSLATIONS,
  roles: ROLES_TRANSLATIONS,
  audit_action: AUDIT_ACTION_TRANSLATIONS,
  entity: ENTITY_TRANSLATIONS,
} as const;

/**
 * Traduce un valor de enum a español
 * @param value - Valor del enum en inglés
 * @param enumType - Tipo de enum a traducir
 * @returns Valor traducido o el valor original si no se encuentra
 */
export function translateEnum(
  value: string | undefined | null,
  enumType: keyof typeof ENUM_TRANSLATIONS
): string {
  if (!value) return "";
  const translations = ENUM_TRANSLATIONS[enumType];
  return translations[value] || value;
}

/**
 * Traduce un array de valores de enum a español
 * @param values - Array de valores en inglés
 * @param enumType - Tipo de enum a traducir
 * @returns Array de valores traducidos
 */
export function translateEnumArray(
  values: string[] | undefined | null,
  enumType: keyof typeof ENUM_TRANSLATIONS
): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => translateEnum(v, enumType));
}

/**
 * Obtiene todas las traducciones disponibles para un tipo de enum
 * @param enumType - Tipo de enum
 * @returns Objeto con todas las traducciones
 */
export function getEnumTranslations(
  enumType: keyof typeof ENUM_TRANSLATIONS
): Dictionary {
  return ENUM_TRANSLATIONS[enumType] || {};
}

/**
 * Obtiene las opciones de un enum como array de objetos {label, value}
 * Útil para selectores y pickers
 */
export function getEnumOptions(
  enumType: keyof typeof ENUM_TRANSLATIONS
): Array<{ label: string; value: string }> {
  const translations = ENUM_TRANSLATIONS[enumType] || {};
  return Object.entries(translations).map(([value, label]) => ({
    label,
    value,
  }));
}

