/**
 * Helper para mapear estados entre la app móvil y el backend
 */

// Mapeo de estados de guía: Móvil → Backend
export const mapGuideStatusToBackend = (
  mobileStatus: string
): 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED' => {
  const statusMap: Record<string, any> = {
    pendiente: 'COLLECTED',
    recolectada: 'COLLECTED',
    enTransito: 'IN_TRANSIT',
    recibida: 'RECEIVED',
    proceso: 'IN_PROCESS',
    enProceso: 'IN_PROCESS',
    terminado: 'COMPLETED',
    completada: 'COMPLETED',
    entregado: 'DELIVERED',
    entregada: 'DELIVERED',
  };

  return statusMap[mobileStatus] || 'COLLECTED';
};

// Mapeo de estados de guía: Backend → Móvil (para mostrar)
export const mapGuideStatusToMobile = (
  backendStatus: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED'
): string => {
  const statusMap: Record<string, string> = {
    COLLECTED: 'Recolectada',
    IN_TRANSIT: 'En Tránsito',
    RECEIVED: 'Recibida',
    IN_PROCESS: 'En Proceso',
    COMPLETED: 'Completada',
    DELIVERED: 'Entregada',
  };

  return statusMap[backendStatus] || 'Desconocido';
};

// Mapeo de condición general
export const mapGeneralCondition = (condition?: string): 'GOOD' | 'REGULAR' | 'BAD' => {
  const conditionMap: Record<string, any> = {
    buena: 'GOOD',
    good: 'GOOD',
    regular: 'REGULAR',
    mala: 'BAD',
    bad: 'BAD',
  };

  return conditionMap[condition?.toLowerCase() || ''] || 'REGULAR';
};

// Mapeo de tipo de servicio
export const mapServiceType = (type?: string): 'INDUSTRIAL' | 'DOMESTIC' | 'HOSPITAL' | 'HOTEL' => {
  const typeMap: Record<string, any> = {
    industrial: 'INDUSTRIAL',
    domestico: 'DOMESTIC',
    domestic: 'DOMESTIC',
    hospital: 'HOSPITAL',
    hotel: 'HOTEL',
  };

  return typeMap[type?.toLowerCase() || ''] || 'INDUSTRIAL';
};

// Mapeo de tipo de cobro
export const mapChargeType = (type?: string): 'BY_WEIGHT' | 'BY_UNIT' | 'MIXED' => {
  const typeMap: Record<string, any> = {
    peso: 'BY_WEIGHT',
    by_weight: 'BY_WEIGHT',
    unidad: 'BY_UNIT',
    by_unit: 'BY_UNIT',
    mixto: 'MIXED',
    mixed: 'MIXED',
  };

  return typeMap[type?.toLowerCase() || ''] || 'BY_UNIT';
};
