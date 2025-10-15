import { apiClient } from '@/helpers/axios-instance.helper';
import {
  Client,
  CreateClientDto,
  UpdateClientDto,
  ClientsResponse,
} from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { getMockClients, getMockClientById, searchMockClients } from './__mocks__/clients.mock';

// Modo demo: cambiar a true para usar datos mock sin backend
const USE_MOCK_DATA = true;

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return getMockClients();
    }
    const { data } = await apiClient.get<ApiResponse<ClientsResponse>>(
      '/admin-clients/get-all-clients'
    );
    return data.data?.clients || [];
  },

  getById: async (id: string): Promise<Client> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 300));
      const client = getMockClientById(id);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }
      return client;
    }
    const { data } = await apiClient.get<ApiResponse<Client>>(`/admin-clients/get-client/${id}`);
    return data.data!;
  },

  create: async (clientData: CreateClientDto): Promise<Client> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const newClient: Client = {
        id: `client-${Date.now()}`,
        ...clientData,
        branch_office_id: clientData.branch_office_id || 'sucursal-centro-001',
        branch_office_name: 'Sucursal Centro',
        status: 'ACTIVE',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return newClient;
    }
    const { data } = await apiClient.post<ApiResponse<Client>>(
      '/admin-clients/create-client',
      clientData
    );
    return data.data!;
  },

  update: async (id: string, clientData: UpdateClientDto): Promise<Client> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 600));
      const client = getMockClientById(id);
      if (!client) {
        throw new Error('Cliente no encontrado');
      }
      return { ...client, ...clientData, updated_at: new Date().toISOString() };
    }
    const { data } = await apiClient.patch<ApiResponse<Client>>(
      `/admin-clients/update-client/${id}`,
      clientData
    );
    return data.data!;
  },

  delete: async (id: string): Promise<void> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return;
    }
    await apiClient.delete(`/admin-clients/delete-client/${id}`);
  },

  search: async (query: string): Promise<Client[]> => {
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 400));
      return searchMockClients(query);
    }
    const { data } = await apiClient.get<ApiResponse<ClientsResponse>>(
      `/admin-clients/get-all-clients?search=${query}`
    );
    return data.data?.clients || [];
  },
};
