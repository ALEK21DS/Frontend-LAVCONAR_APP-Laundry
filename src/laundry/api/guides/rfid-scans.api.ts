import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

/**
 * Cliente Axios autenticado para el módulo de escaneos RFID
 * Base URL: /admin-guides
 */
export const rfidScansApi = createAuthenticatedAxiosInstance('/admin-guides');

