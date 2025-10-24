import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client } from '@/laundry/interfaces/clients/clients.interface';

interface BackendResponse {
  status: number;
  message: string;
  data: Client[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface UseClientsParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
}

/**
 * Hook para obtener la lista de clientes con paginación
 */
export const useClients = ({ 
  page = 1, 
  limit = 10,
  search,
  status 
}: UseClientsParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clients', page, limit, search, status],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await clientsApi.get<BackendResponse>('/', {
        params: { 
          page, 
          limit,
          ...(search && { search }),
          ...(status && { status }),
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const clients = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || page;

  return {
    clients,
    total,
    totalPages,
    currentPage,
    isLoading,
    error: error?.message,
    refetch,
  };
};

