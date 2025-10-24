import React, { type PropsWithChildren, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Componente que verifica y refresca el estado de autenticación periódicamente
 * Similar al CheckAuthProvider de la web
 */
export const AuthProvider = ({ children }: PropsWithChildren) => {
  const { checkAuthStatus, isAuthenticated, refreshToken } = useAuthStore();
  const [hasRefreshToken, setHasRefreshToken] = React.useState(false);

  // Verificar si hay refresh token al iniciar
  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('auth-refresh-token');
      setHasRefreshToken(!!token);
    };
    checkToken();
  }, [isAuthenticated, refreshToken]);

  useQuery({
    queryKey: ['auth-check'],
    queryFn: async () => {
      try {
        return await checkAuthStatus();
      } catch (error) {
        // Silenciar errores de refresh si no hay token
        return { success: false, message: 'No refresh token' };
      }
    },
    retry: false,
    // Refrescar cada 50 minutos (antes de que expire el token de 1 hora)
    refetchInterval: 1000 * 60 * 50, // 50 minutos
    // Solo ejecutar si está autenticado Y hay refresh token
    enabled: isAuthenticated && hasRefreshToken,
  });

  // No mostrar loading, dejar que el AppNavigator maneje la navegación
  return <>{children}</>;
};

