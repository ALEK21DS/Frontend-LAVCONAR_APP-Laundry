import { useQuery } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment } from '@/laundry/interfaces/garments/garments.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener una prenda por ID
 */
export const useGarment = (id: string | null | undefined) => {
  const {
    data: garment,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['garment', id],
    queryFn: async (): Promise<Garment | undefined> => {
      if (!id || id === 'new') return undefined;
      const { data } = await garmentsApi.get<ApiResponse<Garment>>(`/garments/${id}`);
      return data.data;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    garment,
    isLoading,
    error: error?.message,
    refetch,
  };
};

