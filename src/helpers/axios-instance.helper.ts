import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from '@/config/store/config.store';
import { authApi } from '@/auth/api/auth.api';

// Variable para controlar si ya hay un refresh en progreso
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

/**
 * Intenta refrescar el token de acceso
 */
const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem('auth-refresh-token');
      
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await authApi.refresh(refreshToken);
      
      // Guardar los nuevos tokens
      await AsyncStorage.setItem('auth-token', response.accessToken);
      await AsyncStorage.setItem('auth-refresh-token', response.refreshToken);
      
      return response.accessToken;
    } catch (error) {
      // Si el refresh falla, limpiar todo
      await AsyncStorage.multiRemove(['auth-token', 'auth-refresh-token', 'auth-storage']);
      throw error;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

/**
 * Crea una instancia de Axios con interceptor de autenticación configurado
 * @param endpoint - Endpoint específico para la instancia (opcional)
 * @returns Instancia de Axios configurada con token automático y refresh automático
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

  // Interceptor de respuesta para manejar errores 401 con refresh automático
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Si es un error 401 y no hemos reintentado aún
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Intentar refrescar el token
          const newAccessToken = await refreshAccessToken();
          
          // Actualizar el header con el nuevo token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          
          // Reintentar la petición original con el nuevo token
          return instance(originalRequest);
        } catch (refreshError) {
          // Si el refresh falla, es necesario hacer logout
          console.error('Error al refrescar token, sesión expirada:', refreshError);
          
          // Limpiar todo el estado
          await AsyncStorage.multiRemove(['auth-token', 'auth-refresh-token', 'auth-storage']);
          
          // Importar dinámicamente para evitar dependencias circulares
          const { useAuthStore } = await import('@/auth/store/auth.store');
          useAuthStore.getState().logout();
          
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(
        error instanceof Error ? error : new Error(String(error))
      );
    }
  );

  return instance;
};
