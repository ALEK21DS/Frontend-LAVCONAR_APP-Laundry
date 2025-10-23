import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para guías
export const guidesApi = createAuthenticatedAxiosInstance('/admin-guides');
