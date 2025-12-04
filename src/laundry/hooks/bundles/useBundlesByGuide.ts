import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Bundle } from '@/laundry/interfaces/bundles';

interface BackendResponse {
  status: number;
  message: string;
  data: Bundle[];
  timestamp: string;
}

/**
 * Hook para obtener todos los bultos de una guía específica
 */
export const useBundlesByGuide = (guide_id: string | null, enabled: boolean = true) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['bundles-by-guide', guide_id],
    queryFn: async (): Promise<BackendResponse> => {
      if (!guide_id) {
        return {
          status: 200,
          message: 'No se proporcionó ID de guía',
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      try {
        const response = await guidesApi.get<BackendResponse>(`/get-bundles-by-guide/${guide_id}`);
        return response.data;
      } catch (error: any) {
        if (error?.response?.status === 404) {
          return {
            status: 200,
            message: 'No se encontraron bultos',
            data: [],
            timestamp: new Date().toISOString(),
          };
        }
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: true,
    retry: false,
    enabled: enabled && !!guide_id,
  });

  const bundles = data?.data || [];

  return {
    bundles,
    isLoading,
    error: error?.message,
    refetch,
  };
};

