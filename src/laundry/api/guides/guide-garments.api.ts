import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

/**
 * Cliente Axios autenticado para el módulo de detalles de guías (guide-garments)
 * Base URL: /admin-guides
 */
export const guideGarmentsApi = createAuthenticatedAxiosInstance('/admin-guides');

