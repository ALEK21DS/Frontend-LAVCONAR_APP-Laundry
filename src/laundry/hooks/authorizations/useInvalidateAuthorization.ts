import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizationsApi } from '@/laundry/api/authorizations/authorizations.api';
import type { ApiResponse } from '@/interfaces/base.response';

interface InvalidateAuthorizationParams {
  entity_type: string;
  entity_id: string;
}

/**
 * Hook para invalidar autorizaciones existentes para una entidad
 */
export const useInvalidateAuthorization = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (params: InvalidateAuthorizationParams): Promise<void> => {
      await authorizationsApi.post<ApiResponse<void>>('/invalidate', params);
    },
    onSuccess: () => {
      // Invalidar queries de autorizaciones
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['authorization-check'] });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Error al invalidar autorización';
      console.error('Error al invalidar autorización:', errorMessage);
    },
  });

  return {
    invalidateAuthorizationAsync: mutation.mutateAsync,
    invalidateAuthorization: mutation.mutate,
    isInvalidating: mutation.isPending,
    error: mutation.error,
  };
};

