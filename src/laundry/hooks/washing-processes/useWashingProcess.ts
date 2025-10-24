import { useQuery } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener un proceso de lavado por ID
 */
export const useWashingProcess = (id: string | null | undefined) => {
  const {
    data: washingProcess,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['washing-process', id],
    queryFn: async (): Promise<WashingProcess | undefined> => {
      if (!id) return undefined;
      const { data } = await washingProcessesApi.get<ApiResponse<WashingProcess>>(`/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    washingProcess,
    isLoading,
    error: error?.message,
    refetch,
  };
};

