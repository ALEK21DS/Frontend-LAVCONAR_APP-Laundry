import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para clientes
export const clientsApi = createAuthenticatedAxiosInstance('/admin-clients');
