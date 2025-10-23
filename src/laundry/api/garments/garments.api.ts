import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para prendas
// Nota: Las prendas están bajo el endpoint de guías
export const garmentsApi = createAuthenticatedAxiosInstance('/admin-guides');

