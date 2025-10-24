import { createAuthenticatedAxiosInstance } from '@/helpers';

/**
 * Cliente Axios autenticado para el módulo de procesos de lavado
 * Base URL: /admin-processes
 */
export const washingProcessesApi = createAuthenticatedAxiosInstance('/admin-processes');

