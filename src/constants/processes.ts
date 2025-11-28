// NOTA: Los estados y labels de guías ahora vienen del catálogo 'guide_status'
// Solo mantenemos los colores hardcoded porque tienen un sistema de fallback a gris

export const GUIDE_STATUS_COLORS = {
  // Servicio Personal
  SENT: '#6B7280', // gray - gris (enviada)
  IN_PROCESS: '#3B82F6', // primary - azul (en proceso)
  WASHING: '#06B6D4', // cyan - cian (lavado)
  DRYING: '#F59E0B', // warning - amarillo (secado)
  IRONING: '#DC2626', // red - rojo (planchado)
  FOLDING: '#7C3AED', // purple - morado (doblado)
  PACKAGING: '#8B5CF6', // purple - morado (empaque)
  LOADING: '#84CC16', // lime - verde lima (carga)
  RECEIVED_AT_LOCAL: '#10B981', // success - verde (recibida en local)
  DELIVERED_TO_CUSTOMER: '#22C55E', // green - verde (entregada al cliente)
  // Servicio Industrial
  COLLECTED: '#F59E0B', // warning - amarillo (recolectada)
  IN_TRANSIT: '#3B82F6', // primary - azul (en tránsito)
  RECEIVED: '#8B5CF6', // purple - morado (recibida)
  SHIPPING: '#EF4444', // red - rojo (embarque)
  // Estados generales
  COMPLETED: '#10B981', // success - verde (completada)
  DELIVERED: '#6B7280', // gray - gris (entregada)
};

// NOTA: Estas constantes ya vienen de catálogos:
// - GENERAL_CONDITIONS -> catálogo 'general_condition'
// - SERVICE_TYPES -> catálogo 'service_type'
// - SERVICE_PRIORITIES -> catálogo 'service_priority'
// - WASHING_TYPES -> catálogo 'washing_type'
// CHARGE_TYPES no se usa en el código

// Colores para tipos de proceso (solo colores, labels/descriptions/icons vienen del catálogo)
export const PROCESS_TYPE_COLORS = {
  IN_PROCESS: '#3B82F6', // azul (en proceso)
  WASHING: '#06B6D4', // cyan (lavado)
  DRYING: '#F59E0B', // amarillo (secado)
  IRONING: '#DC2626', // rojo (planchado)
  FOLDING: '#7C3AED', // morado (doblado)
  PACKAGING: '#8B5CF6', // morado (empaque)
  SHIPPING: '#EF4444', // rojo (embarque)
  LOADING: '#84CC16', // verde lima (carga)
  DELIVERED: '#22C55E', // verde (entrega)
};

// Colores para estados de proceso de lavado
export const PROCESS_STATUS_COLORS = {
  PENDING: '#F59E0B', // warning - amarillo (pendiente)
  IN_PROGRESS: '#3B82F6', // primary - azul (en progreso)
  COMPLETED: '#10B981', // success - verde (completado)
  CANCELLED: '#EF4444', // red - rojo (cancelado)
  FAILED: '#DC2626', // red - rojo oscuro (fallido)
  PAUSED: '#6B7280', // gray - gris (pausado)
  ON_HOLD: '#8B5CF6', // purple - morado (en espera)
};

// NOTA: PROCESS_STATUS y PROCESS_STATUS_LABELS ya no se usan
