import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth.api';
import { LoginResponse } from '../interfaces/auth.response';

/**
 * Acción para refrescar el token de acceso usando el refresh token
 */
export const refreshAction = async (): Promise<LoginResponse> => {
  const refreshToken = await AsyncStorage.getItem('auth-refresh-token');
  
  if (!refreshToken) {
    throw new Error('No hay refresh token disponible');
  }

  try {
    const response = await authApi.refresh(refreshToken);

    if (!response) {
      throw new Error('Refresh failed');
    }

    // Guardar nuevos tokens
    await AsyncStorage.setItem('auth-token', response.accessToken);
    await AsyncStorage.setItem('auth-refresh-token', response.refreshToken);

    return response;
  } catch (error) {
    console.error('Error al refrescar token:', error);
    throw error;
  }
};

