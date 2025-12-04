import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Bundle } from '@/laundry/interfaces/bundles';

interface BackendResponse {
  status: number;
  message: string;
  data: Bundle;
  timestamp: string;
}

/**
 * Hook para obtener un bulto específico por ID
 */
export const useBundle = (bundle_id: string | null, enabled: boolean = true) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bundle', bundle_id],
    queryFn: async (): Promise<BackendResponse> => {
      if (!bundle_id) {
        throw new Error('ID de bulto no proporcionado');
      }

      const response = await guidesApi.get<BackendResponse>(`/get-bundle/${bundle_id}`);
      return response.data;
    },
    staleTime: 0,
    gcTime: 1000,
    retry: false,
    enabled: enabled && !!bundle_id,
  });

  const bundle = data?.data;

  return {
    bundle,
    isLoading,
    error: error?.message,
    refetch,
  };
};

