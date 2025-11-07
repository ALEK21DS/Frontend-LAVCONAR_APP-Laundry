/**
 * Traducciones centralizadas para enums que NO vienen de catálogos dinámicos
 */

type Dictionary = Record<string, string>;

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

// Mapa centralizado de traducciones vigentes
const ENUM_TRANSLATIONS = {
  notification_type: NOTIFICATION_TYPE_TRANSLATIONS,
  notification_status: NOTIFICATION_STATUS_TRANSLATIONS,
  active_inactive: STATUS_TRANSLATIONS,
  roles: ROLES_TRANSLATIONS,
  audit_action: AUDIT_ACTION_TRANSLATIONS,
  entity: ENTITY_TRANSLATIONS,
} as const;

export function translateEnum(
  value: string | undefined | null,
  enumType: keyof typeof ENUM_TRANSLATIONS
): string {
  if (!value) return "";
  const translations = ENUM_TRANSLATIONS[enumType];
  return translations[value] || value;
}

export function translateEnumArray(
  values: string[] | undefined | null,
  enumType: keyof typeof ENUM_TRANSLATIONS
): string[] {
  if (!Array.isArray(values)) return [];
  return values.map((v) => translateEnum(v, enumType));
}

export function getEnumTranslations(
  enumType: keyof typeof ENUM_TRANSLATIONS
): Dictionary {
  return ENUM_TRANSLATIONS[enumType] || {};
}

export function getEnumOptions(
  enumType: keyof typeof ENUM_TRANSLATIONS
): Array<{ label: string; value: string }> {
  const translations = ENUM_TRANSLATIONS[enumType] || {};
  return Object.entries(translations).map(([value, label]) => ({
    label,
    value,
  }));
}

