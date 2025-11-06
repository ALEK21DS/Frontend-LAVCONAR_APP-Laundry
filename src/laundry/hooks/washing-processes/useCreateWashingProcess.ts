import { useMutation, useQueryClient } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { CreateWashingProcessDto, WashingProcess } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para crear un nuevo proceso de lavado
 */
export const useCreateWashingProcess = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (processData: CreateWashingProcessDto): Promise<WashingProcess> => {
      const { data } = await washingProcessesApi.post<ApiResponse<WashingProcess>>(
        '/create-washing-process',
        processData
      );
      return data.data;
    },
    onSuccess: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scans'] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    createWashingProcessAsync: mutation.mutateAsync,
    createWashingProcess: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};

