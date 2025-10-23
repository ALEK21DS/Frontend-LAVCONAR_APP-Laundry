import axios, { type AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from '@/config/store/config.store';

/**
 * Crea una instancia de Axios con interceptor de autenticación configurado
 * @param endpoint - Endpoint específico para la instancia (opcional)
 * @returns Instancia de Axios configurada con token automático
 */
export const createAuthenticatedAxiosInstance = (
  endpoint?: string
): AxiosInstance => {
  const { apiBaseUrl } = useConfigStore.getState();
  
  const instance = axios.create({
    baseURL: endpoint ? `${apiBaseUrl}${endpoint}` : apiBaseUrl,
    timeout: 10000,
  });

  // Interceptor para agregar el token automáticamente
  instance.interceptors.request.use(
    async (config) => {
      const token = await AsyncStorage.getItem('auth-token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  );

  // Interceptor de respuesta (para manejar errores 401)
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        await AsyncStorage.multiRemove(['auth-token', 'auth-user']);
      }
      return Promise.reject(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  );

  return instance;
};
