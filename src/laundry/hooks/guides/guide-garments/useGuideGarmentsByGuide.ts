import { useQuery } from '@tanstack/react-query';
import { guideGarmentsApi } from '@/laundry/api/guides/guide-garments.api';
import { GuideGarment } from '@/laundry/interfaces/guides/guide-garment.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener todos los detalles de una guía específica
 */
export const useGuideGarmentsByGuide = (guideId: string, enabled = true) => {
  return useQuery({
    queryKey: ['guide-garments-by-guide', { guideId }],
    queryFn: async () => {
      const { data } = await guideGarmentsApi.get<ApiResponse<GuideGarment[]>>(`/get-guide-garment-by-guide/${guideId}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled: enabled && !!guideId,
  });
};

