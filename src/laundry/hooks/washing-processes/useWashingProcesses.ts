import { useQuery } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcess, WashingProcessFilters } from '@/laundry/interfaces/washing-processes/washing-processes.interface';

interface BackendResponse {
  status: number;
  message: string;
  data: WashingProcess[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

/**
 * Hook para obtener la lista de procesos de lavado con filtros
 */
export const useWashingProcesses = (filters: WashingProcessFilters = {}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['washing-processes', filters],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await washingProcessesApi.get<BackendResponse>('/get-all-washing-processes', {
        params: filters
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const washingProcesses = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || 1;

  return {
    washingProcesses,
    total,
    totalPages,
    currentPage,
    isLoading,
    isError,
    error,
    refetch,
  };
};

