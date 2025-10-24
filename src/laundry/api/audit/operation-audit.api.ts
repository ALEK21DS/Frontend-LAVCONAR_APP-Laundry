import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

/**
 * Cliente Axios autenticado para el módulo de auditoría de operaciones
 * Base URL: /audit/operations
 */
export const operationAuditApi = createAuthenticatedAxiosInstance('/audit/operations');

