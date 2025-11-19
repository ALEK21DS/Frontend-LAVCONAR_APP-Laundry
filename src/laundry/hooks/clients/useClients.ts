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
  branch_office_id?: string;
  only_active_status?: boolean; // Para filtrar solo clientes con status ACTIVE en selectores
}

/**
 * Hook para obtener la lista de clientes con paginación
 */
export const useClients = ({ 
  page = 1, 
  limit = 10,
  search,
  status,
  branch_office_id,
  only_active_status 
}: UseClientsParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clients', page, limit, search, status, branch_office_id, only_active_status],
    queryFn: async (): Promise<BackendResponse> => {
      const params: any = { 
        page, 
        limit,
      };
      
      if (search) params.search = search;
      if (status) params.status = status;
      // Pasar branch_office_id solo si está definido y no es una cadena vacía
      if (branch_office_id && branch_office_id.trim() !== '') {
        params.branch_office_id = branch_office_id.trim();
      }
      if (only_active_status) params.only_active_status = true;
      
      const response = await clientsApi.get<BackendResponse>('/', { params });
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

