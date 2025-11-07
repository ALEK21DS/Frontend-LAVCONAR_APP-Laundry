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

export * from './clients';
export * from './guides';
export * from './catalogs';
export * from './vehicles';
export * from './machines';
export * from './washing-processes';
export * from './dashboard';