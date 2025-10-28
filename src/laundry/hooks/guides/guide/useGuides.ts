import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';

interface BackendResponse {
  status: number;
  message: string;
  data: Guide[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface UseGuidesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  service_type?: 'INDUSTRIAL' | 'PERSONAL';
  enabled?: boolean;
}

/**
 * Hook para obtener la lista paginada de guías
 */
export const useGuides = ({ 
  page = 1, 
  limit = 10, 
  search, 
  status,
  service_type,
  enabled = true 
}: UseGuidesParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', { page, limit, search, status, service_type }],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await guidesApi.get<BackendResponse>('/get-all-guides', {
        params: {
          page,
          limit,
          search,
          // status: NO soportado por el backend, filtraremos en frontend
          service_type,
        }
      });
      
      // Filtrar por status en frontend si se proporciona
      let filteredData = response.data.data || [];
      if (status) {
        filteredData = filteredData.filter(guide => guide.status === status);
      }
      
      return {
        ...response.data,
        data: filteredData,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled,
  });

  const guides = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || page;

  return {
    guides,
    total,
    totalPages,
    currentPage,
    isLoading,
    error: error?.message,
    refetch,
  };
};

