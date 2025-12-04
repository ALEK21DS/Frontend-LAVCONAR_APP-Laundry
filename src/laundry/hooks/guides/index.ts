/**
 * Hooks de guías
 * Exporta todos los hooks relacionados con la gestión de guías
 * Estructura unificada bajo /admin-guides endpoint
 */

// Hooks de guías básicos
export * from './guide';

// Hooks de prendas (garments)
export * from './garments';

// Hooks de detalles de guías (guide-garments)
export * from './guide-garments';

// Hooks de escaneos RFID
export * from './rfid-scans';

// Hooks de bultos
export * from '../../hooks/bundles';