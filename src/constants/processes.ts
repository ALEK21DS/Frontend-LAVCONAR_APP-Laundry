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

// Mantener compatibilidad con código antiguo
export const PROCESS_STATUS = GUIDE_STATUS;
export const PROCESS_STATUS_LABELS = GUIDE_STATUS_LABELS;
export const PROCESS_STATUS_COLORS = GUIDE_STATUS_COLORS;
