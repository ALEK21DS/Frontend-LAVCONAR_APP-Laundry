import { createAuthenticatedAxiosInstance } from '@/helpers/axios-instance.helper';

// API con autenticación automática para tags RFID
export const tagsApi = createAuthenticatedAxiosInstance('/admin-tags');
