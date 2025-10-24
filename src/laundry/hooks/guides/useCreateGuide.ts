import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide, CreateGuideDto } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para crear una nueva guía
 */
export const useCreateGuide = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (guideData: CreateGuideDto): Promise<Guide> => {
      const { data } = await guidesApi.post<ApiResponse<Guide>>('/', guideData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar todas las queries de guías para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['guides'] });
      queryClient.invalidateQueries({ queryKey: ['guide'] });
    },
    onError: (err) => {
      console.error('Error al crear guía:', handleApiError(err));
    },
  });

  return {
    createGuide: mutation.mutate,
    createGuideAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
    createSuccess: mutation.isSuccess,
  };
};

