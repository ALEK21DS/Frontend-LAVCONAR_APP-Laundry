import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para eliminar una guía
 */
export const useDeleteGuide = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await guidesApi.delete(`/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar todas las queries de guías
      queryClient.invalidateQueries({ queryKey: ['guides'] });
      
      // Remover la guía específica del cache
      queryClient.removeQueries({ queryKey: ['guide', deletedId] });
    },
    onError: (err) => {
      console.error('Error al eliminar guía:', handleApiError(err));
    },
  });

  return {
    deleteGuide: mutation.mutate,
    deleteGuideAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    deleteSuccess: mutation.isSuccess,
  };
};

