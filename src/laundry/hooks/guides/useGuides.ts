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
}

/**
 * Hook para obtener la lista de guías con paginación
 */
export const useGuides = ({ 
  page = 1, 
  limit = 10,
  search,
  status 
}: UseGuidesParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', page, limit, search, status],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await guidesApi.get<BackendResponse>('/get-all-guides', {
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

