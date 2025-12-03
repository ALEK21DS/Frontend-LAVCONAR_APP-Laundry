import { useQuery } from '@tanstack/react-query';
import { authorizationsApi } from '@/laundry/api/authorizations/authorizations.api';
import type { ApiResponse } from '@/interfaces/base.response';
import type { AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

/**
 * Hook para obtener todas las solicitudes de autorización del usuario actual
 */
export const useGetUserAuthorizations = (enabled: boolean = true) => {
  const query = useQuery({
    queryKey: ['user-authorizations'],
    queryFn: async (): Promise<AuthorizationRequest[]> => {
      const { data } = await authorizationsApi.get<ApiResponse<AuthorizationRequest[]>>('/');
      return data.data || [];
    },
    enabled,
    staleTime: 0, // No cachear, siempre hacer request fresco
  });

  // Filtrar solo las solicitudes aprobadas
  const approvedAuthorizations = query.data?.filter(auth => auth.status === 'APPROVED') || [];

  return {
    authorizations: query.data || [],
    approvedAuthorizations,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

