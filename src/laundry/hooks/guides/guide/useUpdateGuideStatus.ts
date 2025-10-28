import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide, UpdateGuideStatusDto } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

interface UpdateGuideStatusParams {
  id: string;
  data: UpdateGuideStatusDto;
}

/**
 * Hook para actualizar el estado de una guía
 */
export const useUpdateGuideStatus = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data: statusData }: UpdateGuideStatusParams): Promise<Guide> => {
      const { data } = await guidesApi.patch<ApiResponse<Guide>>(`/update-guide/${id}`, statusData);
      return data.data!;
    },
    onSuccess: (updatedGuide) => {
      // Invalidar queries de lista de guías
      queryClient.invalidateQueries({ queryKey: ['guides'] });
      
      // Actualizar la guía específica en el cache
      queryClient.invalidateQueries({ queryKey: ['guide', updatedGuide.id] });
    },
    onError: (err) => {
      console.error('Error al actualizar estado de guía:', handleApiError(err));
    },
  });

  return {
    updateGuideStatus: mutation.mutate,
    updateGuideStatusAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
};

