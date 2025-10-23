import axios from 'axios';
import { useConfigStore } from '@/config/store/config.store';

const getBaseUrl = () => useConfigStore.getState().apiBaseUrl;

// API SIN autenticación para sucursales (se usa antes del login)
// Nota: No usa createAuthenticatedAxiosInstance porque no requiere token
export const branchOfficesApi = axios.create({
  timeout: 10000,
});

// Interceptor para actualizar baseURL dinámicamente
branchOfficesApi.interceptors.request.use((config) => {
  config.baseURL = `${getBaseUrl()}/admin-branch-offices`;
  return config;
});

