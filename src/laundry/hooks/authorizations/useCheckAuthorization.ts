import { useQuery } from '@tanstack/react-query';
import { authorizationsApi } from '@/laundry/api/authorizations/authorizations.api';
import type { ApiResponse } from '@/interfaces/base.response';
import type { CheckAuthorizationParams } from '@/laundry/interfaces/authorizations/authorization.interface';

interface CheckAuthorizationResponse {
  hasAuthorization: boolean;
  authorizationId?: string;
  message?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Hook para verificar si el usuario tiene autorización para una acción específica
 */
export const useCheckAuthorization = (params: CheckAuthorizationParams, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: ['authorization-check', params.entity_type, params.entity_id, params.action_type],
    queryFn: async (): Promise<CheckAuthorizationResponse> => {
      const queryParams = new URLSearchParams({
        entity_type: params.entity_type,
        entity_id: params.entity_id,
        action_type: params.action_type,
      });

      const { data } = await authorizationsApi.get<ApiResponse<CheckAuthorizationResponse>>(`/check?${queryParams.toString()}`);
      return data.data!;
    },
    enabled: enabled && !!params.entity_type && !!params.entity_id && !!params.action_type,
    staleTime: 0, // No cachear, siempre hacer request fresco
    refetchInterval: enabled ? 3000 : false, // Refetch automático cada 3 segundos si enabled es true
  });

  return {
    hasAuthorization: query.data?.hasAuthorization || false,
    authorizationId: query.data?.authorizationId,
    message: query.data?.message,
    status: query.data?.status,
    isChecking: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

