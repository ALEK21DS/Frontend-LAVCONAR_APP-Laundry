import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Bundle, CreateBundleDto } from '@/laundry/interfaces/bundles';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para crear un nuevo bulto
 */
export const useCreateBundle = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (bundleData: CreateBundleDto): Promise<Bundle> => {
      const { data } = await guidesApi.post<ApiResponse<Bundle>>('/create-bundle', bundleData);
      return data.data!;
    },
    onSuccess: (data) => {
      // Invalidar queries de buntos de esta guía
      queryClient.invalidateQueries({ queryKey: ['bundles-by-guide', data.guide_id], exact: false });
      queryClient.invalidateQueries({ queryKey: ['bundles'], exact: false });
      // Refrescar guías porque ahora tienen bultos asociados
      queryClient.invalidateQueries({ queryKey: ['guides'], exact: false });
    },
    onError: (err) => {
      console.error('Error al crear bulto:', handleApiError(err));
    },
  });

  return {
    createBundle: mutation.mutate,
    createBundleAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
    createSuccess: mutation.isSuccess,
  };
};

