import { apiClient } from '@/helpers/axios-instance.helper';
import { LoginCredentials, LoginResponse } from '../interfaces/auth.response';
import { ApiResponse } from '@/interfaces/base.response';

// Modo demo: evita llamadas reales al backend para logout
const USE_DEMO_AUTH = true;

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/auth/login',
      credentials
    );
    return data.data!;
  },

  logout: async (): Promise<void> => {
    if (USE_DEMO_AUTH) {
      await new Promise(resolve => setTimeout(resolve, 150));
      return;
    }
    await apiClient.post('/api/auth/logout');
  },

  validateToken: async (): Promise<boolean> => {
    try {
      const { data } = await apiClient.get<ApiResponse<{ valid: boolean }>>('/api/auth/validate');
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
      token: 'demo-token-12345-67890-abcdef',
      user: demoUser,
    };
  },
};
