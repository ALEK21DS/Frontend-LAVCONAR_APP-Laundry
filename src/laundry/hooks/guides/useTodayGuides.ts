import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener las guías del día actual
 * Se refresca automáticamente cada 2 minutos
 */
export const useTodayGuides = () => {
  const {
    data: guides = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', 'today'],
    queryFn: async (): Promise<Guide[]> => {
      const response = await guidesApi.get<ApiResponse<Guide[]>>('/today');
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 1, // 1 minuto
    refetchInterval: 1000 * 60 * 2, // Refrescar cada 2 minutos
  });

  return {
    guides,
    isLoading,
    error: error?.message,
    refetch,
  };
};

