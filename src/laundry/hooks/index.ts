/**
 * Barrel export de todos los hooks de laundry
 * Permite importar hooks desde un solo lugar
 * 
 * Ejemplo de uso:
 * import { useClients, useGuides, useBranchOffices } from '@/laundry/hooks';
 * 
 * O también desde módulos específicos:
 * import { useClients, useCreateClient } from '@/laundry/hooks/clients';
 */

// Clientes
export * from './clients';

// Guías (incluye guías, prendas, detalles de guías, escaneos RFID)
// Todos unificados bajo /admin-guides endpoint
export * from './guides';

// Tags RFID
export * from './tags';

// Procesos de lavado
export * from './washing-processes';

// Sucursales
export * from './branch-offices';

// Dashboard
export * from './dashboard';
