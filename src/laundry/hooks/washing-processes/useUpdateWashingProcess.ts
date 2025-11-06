import { useMutation, useQueryClient } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { UpdateWashingProcessDto, WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para actualizar un proceso de lavado existente
 */
export const useUpdateWashingProcess = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWashingProcessDto }): Promise<WashingProcess> => {
      const { data: response } = await washingProcessesApi.patch<ApiResponse<WashingProcess>>(
        `/update-washing-process/${id}`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scans'] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    updateWashingProcessAsync: mutation.mutateAsync,
    updateWashingProcess: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};

