import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';
import { AxiosError } from 'axios';

interface ClientsResponse extends ApiResponse<Client[]> {}

interface ClientsProps {
  page?: number;
  limit?: number;
  search?: string;
  branch_office_id?: string;
  status?: string;
}

/**
 * Obtiene la lista de clientes con paginación y filtros
 */
export const getClientsAction = async ({
  page,
  limit,
  search,
  branch_office_id,
  status,
}: ClientsProps): Promise<ClientsResponse> => {
  try {
    const { data } = await clientsApi.get<ClientsResponse>(`/`, {
      params: { page, limit, search, branch_office_id, status },
    });
    if (!data) throw new Error('Clients not found');

    return data;
  } catch (error) {
    // Si es un error 404, retornamos una respuesta vacía con el mensaje del backend
    if (error instanceof AxiosError && error.response?.status === 404) {
      const { message } = extractAxiosError(error, 'Clientes no encontrados');
      return {
        status: 404,
        message,
        data: [],
        totalData: 0,
        pagination: {
          page: page || 1,
          limit: limit || 10,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    console.log(error);
    throw new Error(`Failed to fetch clients: ${error}`);
  }
};
