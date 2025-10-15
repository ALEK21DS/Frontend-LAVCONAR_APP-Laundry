export const PROCESSES = [
  { label: 'Lavado', value: 'lavado' },
  { label: 'Secado', value: 'secado' },
  { label: 'Planchado', value: 'planchado' },
  { label: 'Doblado', value: 'doblado' },
  { label: 'Tintorería', value: 'tintoreria' },
  { label: 'Lavado en Seco', value: 'lavado_seco' },
  { label: 'Lavado Especial', value: 'lavado_especial' },
  { label: 'Planchado Especial', value: 'planchado_especial' },
];

// Estados de guía según backend
export const GUIDE_STATUS = {
  COLLECTED: 'COLLECTED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  IN_PROCESS: 'IN_PROCESS',
  COMPLETED: 'COMPLETED',
  DELIVERED: 'DELIVERED',
};

export const GUIDE_STATUS_LABELS = {
  COLLECTED: 'Recolectada',
  IN_TRANSIT: 'En Tránsito',
  RECEIVED: 'Recibida',
  IN_PROCESS: 'En Proceso',
  COMPLETED: 'Completada',
  DELIVERED: 'Entregada',
};

export const GUIDE_STATUS_COLORS = {
  COLLECTED: '#F59E0B', // warning - amarillo
  IN_TRANSIT: '#3B82F6', // primary - azul
  RECEIVED: '#8B5CF6', // purple - morado
  IN_PROCESS: '#3B82F6', // primary - azul
  COMPLETED: '#10B981', // success - verde
  DELIVERED: '#6B7280', // gray - gris
};

// Condiciones generales
export const GENERAL_CONDITIONS = [
  { label: 'Buena', value: 'GOOD' },
  { label: 'Regular', value: 'REGULAR' },
  { label: 'Mala', value: 'BAD' },
];

// Tipos de servicio
export const SERVICE_TYPES = [
  { label: 'Industrial', value: 'INDUSTRIAL' },
  { label: 'Doméstico', value: 'DOMESTIC' },
  { label: 'Hospital', value: 'HOSPITAL' },
  { label: 'Hotel', value: 'HOTEL' },
];

// Tipos de cobro
export const CHARGE_TYPES = [
  { label: 'Por Peso', value: 'BY_WEIGHT' },
  { label: 'Por Unidad', value: 'BY_UNIT' },
  { label: 'Mixto', value: 'MIXED' },
];

// Mantener compatibilidad con código antiguo
export const PROCESS_STATUS = GUIDE_STATUS;
export const PROCESS_STATUS_LABELS = GUIDE_STATUS_LABELS;
export const PROCESS_STATUS_COLORS = GUIDE_STATUS_COLORS;
