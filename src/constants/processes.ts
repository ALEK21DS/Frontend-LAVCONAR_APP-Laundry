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
  // Servicio Personal
  SENT: 'SENT',
  IN_PROCESS: 'IN_PROCESS',
  WASHING: 'WASHING',
  DRYING: 'DRYING',
  IRONING: 'IRONING',
  FOLDING: 'FOLDING',
  PACKAGING: 'PACKAGING',
  LOADING: 'LOADING',
  RECEIVED_AT_LOCAL: 'RECEIVED_AT_LOCAL',
  DELIVERED_TO_CUSTOMER: 'DELIVERED_TO_CUSTOMER',
  // Servicio Industrial
  COLLECTED: 'COLLECTED',
  IN_TRANSIT: 'IN_TRANSIT',
  RECEIVED: 'RECEIVED',
  SHIPPING: 'SHIPPING',
};

export const GUIDE_STATUS_LABELS = {
  // Servicio Personal
  SENT: 'Enviada',
  IN_PROCESS: 'En Proceso',
  WASHING: 'Lavado',
  DRYING: 'Secado',
  IRONING: 'Planchado',
  FOLDING: 'Doblado',
  PACKAGING: 'Empaque',
  LOADING: 'Carga',
  RECEIVED_AT_LOCAL: 'Recibida en Local',
  DELIVERED_TO_CUSTOMER: 'Entregada al Cliente',
  // Servicio Industrial
  COLLECTED: 'Recolectada',
  IN_TRANSIT: 'En Tránsito',
  RECEIVED: 'Recibida',
  SHIPPING: 'Embarque',
};

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

// Prioridades de servicio
export const SERVICE_PRIORITIES = [
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Alta', value: 'HIGH' },
  { label: 'Urgente', value: 'URGENT' },
];

// Tipos de lavado
export const WASHING_TYPES = [
  { label: 'Lavado Normal', value: 'NORMAL' },
  { label: 'Lavado Delicado', value: 'DELICATE' },
  { label: 'Lavado Industrial', value: 'INDUSTRIAL' },
  { label: 'Lavado en Seco', value: 'DRY_CLEAN' },
  { label: 'Lavado Especial', value: 'SPECIAL' },
];

// Tipos de proceso para el flujo de trabajo
export const PROCESS_TYPES = [
  { 
    label: 'EN PROCESO', 
    value: 'IN_PROCESS',
    description: 'Guías recibidas para procesar',
    icon: 'construct-outline',
    color: '#3B82F6'
  },
  { 
    label: 'LAVADO', 
    value: 'WASHING',
    description: 'Guías en proceso para lavar',
    icon: 'water-outline',
    color: '#06B6D4'
  },
  { 
    label: 'SECADO', 
    value: 'DRYING',
    description: 'Guías lavadas para secar',
    icon: 'sunny-outline',
    color: '#F59E0B'
  },
  { 
    label: 'PLANCHADO', 
    value: 'IRONING',
    description: 'Guías secas para planchar',
    icon: 'flame-outline',
    color: '#DC2626'
  },
  { 
    label: 'DOBLADO', 
    value: 'FOLDING',
    description: 'Guías planchadas para doblar',
    icon: 'layers-outline',
    color: '#7C3AED'
  },
  { 
    label: 'EMPAQUE', 
    value: 'PACKAGING',
    description: 'Guías secas para empacar',
    icon: 'cube-outline',
    color: '#8B5CF6'
  },
  { 
    label: 'EMBARQUE', 
    value: 'SHIPPING',
    description: 'Guías empacadas para embarcar',
    icon: 'boat-outline',
    color: '#EF4444'
  },
  { 
    label: 'CARGA', 
    value: 'LOADING',
    description: 'Guías embarcadas para cargar',
    icon: 'car-outline',
    color: '#84CC16'
  },
  { 
    label: 'ENTREGA', 
    value: 'DELIVERY',
    description: 'Guías cargadas para entregar',
    icon: 'checkmark-circle-outline',
    color: '#22C55E'
  },
];

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

// Mantener compatibilidad con código antiguo
export const PROCESS_STATUS = GUIDE_STATUS;
export const PROCESS_STATUS_LABELS = GUIDE_STATUS_LABELS;
