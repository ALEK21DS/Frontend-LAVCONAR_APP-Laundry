import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/laundry/api/tags/tags.api';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para eliminar un tag RFID
 */
export const useDeleteTag = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (epc: string): Promise<void> => {
      await tagsApi.delete(`/${epc}`);
    },
    onSuccess: () => {
      // Invalidar queries de tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err) => {
      console.error('Error al eliminar tag:', handleApiError(err));
    },
  });

  return {
    deleteTag: mutation.mutate,
    deleteTagAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    deleteSuccess: mutation.isSuccess,
  };
};

