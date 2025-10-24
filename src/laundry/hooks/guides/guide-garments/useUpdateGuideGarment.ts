import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guideGarmentsApi } from '@/laundry/api/guides/guide-garments.api';
import { UpdateGuideGarmentDto, GuideGarment } from '@/laundry/interfaces/guides/guide-garment.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para actualizar un detalle de guía existente
 */
export const useUpdateGuideGarment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateGuideGarmentDto }) => {
      const response = await guideGarmentsApi.patch<ApiResponse<GuideGarment>>(`/update-guide-garment/${id}`, data);
      return response.data;
    },
    onSuccess: (response) => {
      const guideGarment = response.data;
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['guide-garment', { id: guideGarment?.id }] });
      queryClient.invalidateQueries({ queryKey: ['guide-garments'] });
      queryClient.invalidateQueries({ queryKey: ['guide-garments-by-guide', { guideId: guideGarment?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guide', { id: guideGarment?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    updateGuideGarmentAsync: mutation.mutateAsync,
    updateGuideGarment: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};

