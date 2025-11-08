import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener todos los procesos de una guía y construir un índice por estado
 */
export const useWashingProcessByGuide = (
  guideId: string | undefined,
  enabled: boolean = true,
) => {
  const query = useQuery({
    queryKey: ['washing-process-by-guide', guideId],
    queryFn: async (): Promise<WashingProcess[]> => {
      if (!guideId) return [];

      const { data } = await washingProcessesApi.get<ApiResponse<WashingProcess[]>>(
        '/get-all-washing-processes',
        {
          params: {
            page: 1,
            limit: 50,
            guide_id: guideId,
          },
        }
      );

      return (data.data || []).filter((process) => process.guide_id === guideId);
    },
    enabled: enabled && !!guideId,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const processes = query.data ?? [];

  const processByStatus = useMemo(() => {
    return processes.reduce<Record<string, WashingProcess>>((acc, process) => {
      const key = process.status || process.process_type;
      if (!key) {
        return acc;
      }

      const currentUpdatedAt = process.updated_at
        ? new Date(process.updated_at as any).getTime()
        : 0;

      const existing = acc[key];
      const existingUpdatedAt = existing?.updated_at
        ? new Date(existing.updated_at as any).getTime()
        : -Infinity;

      if (!existing || currentUpdatedAt >= existingUpdatedAt) {
        acc[key] = process;
      }

      return acc;
    }, {});
  }, [processes]);

  const latestProcess = useMemo(() => {
    return processes
      .slice()
      .sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at as any).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at as any).getTime() : 0;
        return bDate - aDate;
      })[0] || null;
  }, [processes]);

  return {
    processes,
    processByStatus,
    latestProcess,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

