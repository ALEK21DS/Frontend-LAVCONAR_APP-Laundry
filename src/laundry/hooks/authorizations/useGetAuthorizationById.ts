import { useQuery } from '@tanstack/react-query';
import { authorizationsApi } from '@/laundry/api/authorizations/authorizations.api';
import type { ApiResponse } from '@/interfaces/base.response';
import type { AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

/**
 * Hook para obtener una solicitud de autorización específica por su ID
 */
export const useGetAuthorizationById = (authorizationId: string, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: ['authorization', authorizationId],
    queryFn: async (): Promise<AuthorizationRequest> => {
      const { data } = await authorizationsApi.get<ApiResponse<AuthorizationRequest>>(`/${authorizationId}`);
      return data.data!;
    },
    enabled: enabled && !!authorizationId,
    staleTime: 0, // No cachear, siempre hacer request fresco
    refetchInterval: enabled ? 3000 : false, // Refetch automático cada 3 segundos si enabled es true
  });

  return {
    authorization: query.data,
    status: query.data?.status,
    isChecking: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

