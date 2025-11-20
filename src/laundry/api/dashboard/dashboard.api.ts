import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

/**
 * Cliente Axios autenticado para el dashboard administrativo
 * Base URL: /admin/dashboard
 */
export const dashboardApi = createAuthenticatedAxiosInstance('/admin/dashboard');


