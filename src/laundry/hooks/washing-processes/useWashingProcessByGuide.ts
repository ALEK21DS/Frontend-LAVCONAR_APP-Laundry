import { useQuery } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener un proceso de lavado por guide_id y status
 */
export const useWashingProcessByGuide = (
  guideId: string | undefined,
  status: string | undefined,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['washing-process-by-guide', guideId, status],
    queryFn: async (): Promise<WashingProcess | null> => {
      if (!guideId || !status) return null;

      try {
        const { data } = await washingProcessesApi.get<ApiResponse<WashingProcess[]>>(
          '/get-all-washing-processes',
          {
            params: {
              page: 1,
              limit: 100,
              process_status: status,
            },
          }
        );

        // Buscar el proceso que coincida con guide_id y status
        const process = data.data?.find((p) => p.guide_id === guideId && p.status === status);
        return process || null;
      } catch (error: any) {
        // Si no se encuentra, devolver null en lugar de lanzar error
        if (error?.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: enabled && !!guideId && !!status,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
};

