import { useQuery } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment } from '@/laundry/interfaces/garments/garments.interface';

interface BackendResponse {
  status: number;
  message: string;
  data: Garment[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface UseGarmentsParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Hook para obtener la lista de prendas con paginación
 */
export const useGarments = ({ 
  page = 1, 
  limit = 10,
  search 
}: UseGarmentsParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['garments', page, limit, search],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await garmentsApi.get<BackendResponse>('/get-all-garments', {
        params: { 
          page, 
          limit,
          ...(search && { search }),
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const garments = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || page;

  return {
    garments,
    total,
    totalPages,
    currentPage,
    isLoading,
    error: error?.message,
    refetch,
  };
};

