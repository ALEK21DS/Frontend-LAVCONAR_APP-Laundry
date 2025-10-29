import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authorizationsApi } from '@/laundry/api/authorizations/authorizations.api';
import type { ApiResponse } from '@/interfaces/base.response';
import type { CreateAuthorizationRequestDto, AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

/**
 * Hook para crear una solicitud de autorización
 */
export const useCreateAuthorizationRequest = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateAuthorizationRequestDto): Promise<AuthorizationRequest> => {
      const response = await authorizationsApi.post<ApiResponse<AuthorizationRequest>>('/', data);
      return response.data.data!;
    },
    onSuccess: () => {
      // Invalidar queries de autorizaciones
      queryClient.invalidateQueries({ queryKey: ['authorizations'] });
      queryClient.invalidateQueries({ queryKey: ['authorization-check'] });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Error al crear solicitud de autorización';
      throw new Error(errorMessage);
    },
  });

  return {
    createAuthorizationRequestAsync: mutation.mutateAsync,
    createAuthorizationRequest: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};

