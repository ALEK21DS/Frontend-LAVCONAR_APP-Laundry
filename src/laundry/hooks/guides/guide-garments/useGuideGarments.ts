import { useQuery } from '@tanstack/react-query';
import { guideGarmentsApi } from '@/laundry/api/guides/guide-garments.api';
import { GuideGarment, GuideGarmentFilters } from '@/laundry/interfaces/guides/guide-garment.interface';
import { ApiResponse } from '@/interfaces/base.response';

interface UseGuideGarmentsParams extends GuideGarmentFilters {
  enabled?: boolean;
}

/**
 * Hook para obtener la lista paginada de detalles de guías (guide-garments)
 */
export const useGuideGarments = ({
  page = 1,
  limit = 10,
  search,
  guide_id,
  rfid_code,
  enabled = true,
}: UseGuideGarmentsParams = {}) => {
  return useQuery({
    queryKey: ['guide-garments', { page, limit, search, guide_id, rfid_code }],
    queryFn: async () => {
      const { data } = await guideGarmentsApi.get<ApiResponse<GuideGarment[]>>('/get-all-guide-garments', {
        params: {
          page,
          limit,
          search,
          guide_id,
          rfid_code,
        }
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled,
  });
};

