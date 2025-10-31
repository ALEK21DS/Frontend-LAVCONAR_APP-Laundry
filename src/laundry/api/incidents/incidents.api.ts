import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para incidentes
export const incidentsApi = createAuthenticatedAxiosInstance('/admin-processes');

