import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener una guía por ID
 */
export const useGuide = (id: string | null | undefined) => {
  const {
    data: guide,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guide', id],
    queryFn: async (): Promise<Guide | undefined> => {
      if (!id || id === 'new') return undefined;
      const { data } = await guidesApi.get<ApiResponse<Guide>>(`/${id}`);
      return data.data;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    guide,
    isLoading,
    error: error?.message,
    refetch,
  };
};

