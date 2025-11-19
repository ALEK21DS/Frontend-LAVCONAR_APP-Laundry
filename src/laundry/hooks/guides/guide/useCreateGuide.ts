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
      const { data } = await guidesApi.post<ApiResponse<Guide>>('/create-guide', guideData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries de guías (con todos sus parámetros) para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['guides'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['guide'], exact: false });
      // Forzar refetch de todas las queries de guides activas
      queryClient.refetchQueries({ queryKey: ['guides'], type: 'active' });
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

