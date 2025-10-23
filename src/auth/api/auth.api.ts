import axios from 'axios';
import { useConfigStore } from '@/config/store/config.store';
import { LoginCredentials, LoginResponse } from '../interfaces/auth.response';
import { ApiResponse } from '@/interfaces/base.response';

const getBaseUrl = () => useConfigStore.getState().apiBaseUrl;

// API sin autenticación (login, refresh)
const authApiClient = axios.create({
  timeout: 10000,
});

// Interceptor para actualizar baseURL dinámicamente
authApiClient.interceptors.request.use((config) => {
  config.baseURL = `${getBaseUrl()}/auth`;
  return config;
});

// Modo demo: evita llamadas reales al backend para logout
const USE_DEMO_AUTH = false;

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await authApiClient.post<ApiResponse<LoginResponse>>(
      '/login',
      {
        username: credentials.username,
        password: credentials.password,
        branchOfficeId: credentials.sucursalId, // El backend valida que coincida con la sucursal asignada
      }
    );
    
    return data.data!;
  },

  logout: async (refreshToken: string): Promise<void> => {
    if (USE_DEMO_AUTH) {
      await new Promise(resolve => setTimeout(resolve, 150));
      return;
    }
    await authApiClient.post('/logout', { refreshToken });
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const { data } = await authApiClient.get<ApiResponse<{ valid: boolean }>>('/validate');
      return data.data?.valid || false;
    } catch (error) {
      return false;
    }
  },

  // Función demo para login sin backend
  loginDemo: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));

    const demoUser = {
      id: 'demo-user-001',
      username: credentials.username,
      email: credentials.username.includes('@') ? credentials.username : 'admin@lavconar.com',
      nombre: 'Usuario Demo',
      apellido: 'LAVCONAR',
      roles: ['ADMIN'],
      sucursalId: credentials.sucursalId,
      branch_office_id: credentials.sucursalId,
      branch_office_name: 'Sucursal Demo',
      status: 'ACTIVE',
      is_active: true,
    };

    return {
      accessToken: 'demo-access-token-12345-67890-abcdef',
      refreshToken: 'demo-refresh-token-12345-67890-abcdef',
      expiresIn: 3600,
      user: demoUser,
    };
  },
};
