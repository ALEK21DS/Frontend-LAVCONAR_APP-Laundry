import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConfigStore } from '@/config/store/config.store';

// Función para crear cliente dinámico
export const createApiClient = () => {
  const { apiBaseUrl } = useConfigStore.getState();
  
  console.log('🌐 API Base URL:', apiBaseUrl); // Debug: ver qué URL está usando
  
  return axios.create({
    baseURL: apiBaseUrl,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Cliente por defecto (se actualiza dinámicamente)
export const apiClient = createApiClient();

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('auth-token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['auth-token', 'auth-user']);
    }
    return Promise.reject(error);
  }
);
