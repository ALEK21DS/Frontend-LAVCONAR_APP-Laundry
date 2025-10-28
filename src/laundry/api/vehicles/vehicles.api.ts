import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para vehículos
export const vehiclesApi = createAuthenticatedAxiosInstance('/admin-vehicles');

