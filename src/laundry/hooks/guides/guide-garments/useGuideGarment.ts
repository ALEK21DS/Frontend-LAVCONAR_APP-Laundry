import { useQuery } from '@tanstack/react-query';
import { guideGarmentsApi } from '@/laundry/api/guides/guide-garments.api';
import { GuideGarment } from '@/laundry/interfaces/guides/guide-garment.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener un detalle de guía específico por ID
 */
export const useGuideGarment = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['guide-garment', { id }],
    queryFn: async () => {
      const { data } = await guideGarmentsApi.get<ApiResponse<GuideGarment>>(`/get-guide-garment/${id}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled: enabled && !!id,
  });
};

