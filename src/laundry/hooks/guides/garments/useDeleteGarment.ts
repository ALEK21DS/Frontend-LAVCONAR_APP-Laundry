import { useMutation, useQueryClient } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para eliminar una prenda
 */
export const useDeleteGarment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await garmentsApi.delete(`/garments/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar todas las queries de prendas
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      
      // Remover la prenda específica del cache
      queryClient.removeQueries({ queryKey: ['garment', deletedId] });
    },
    onError: (err) => {
      console.error('Error al eliminar prenda:', handleApiError(err));
    },
  });

  return {
    deleteGarment: mutation.mutate,
    deleteGarmentAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    deleteSuccess: mutation.isSuccess,
  };
};

