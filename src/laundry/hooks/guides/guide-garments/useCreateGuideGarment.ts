import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guideGarmentsApi } from '@/laundry/api/guides/guide-garments.api';
import { CreateGuideGarmentDto, GuideGarment } from '@/laundry/interfaces/guides/guide-garment.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para crear un nuevo detalle de guía (guide-garment)
 */
export const useCreateGuideGarment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (guideGarment: CreateGuideGarmentDto) => {
      const { data } = await guideGarmentsApi.post<ApiResponse<GuideGarment>>('/create-guide-garment', guideGarment);
      return data;
    },
    onSuccess: (response) => {
      const guideGarment = response.data;
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['guide-garments'] });
      queryClient.invalidateQueries({ queryKey: ['guide-garments-by-guide', { guideId: guideGarment?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guide', { id: guideGarment?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    createGuideGarmentAsync: mutation.mutateAsync,
    createGuideGarment: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};

