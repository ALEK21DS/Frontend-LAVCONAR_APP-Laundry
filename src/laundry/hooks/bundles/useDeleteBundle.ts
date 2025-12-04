import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Bundle } from '@/laundry/interfaces/bundles';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para eliminar un bulto
 */
export const useDeleteBundle = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (bundle_id: string): Promise<Bundle> => {
      const { data } = await guidesApi.delete<ApiResponse<Bundle>>(`/delete-bundle/${bundle_id}`);
      return data.data!;
    },
    onSuccess: (data) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['bundles-by-guide', data.guide_id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['bundles'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['bundle', data.id], exact: false });
    },
    onError: (err) => {
      console.error('Error al eliminar bulto:', handleApiError(err));
    },
  });

  return {
    deleteBundle: mutation.mutate,
    deleteBundleAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    deleteSuccess: mutation.isSuccess,
  };
};

