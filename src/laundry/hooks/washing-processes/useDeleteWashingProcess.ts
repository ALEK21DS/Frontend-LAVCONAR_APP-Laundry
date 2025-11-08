import { useMutation, useQueryClient } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';

export const useDeleteWashingProcess = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await washingProcessesApi.delete(`/delete-washing-process/${id}`);
    },
    onSuccess: (_, processId) => {
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      queryClient.invalidateQueries({ queryKey: ['washing-process-by-guide'] });
      queryClient.removeQueries({ queryKey: ['washing-process', processId] });
    },
  });

  return {
    deleteWashingProcess: mutation.mutate,
    deleteWashingProcessAsync: mutation.mutateAsync,
    isDeletingProcess: mutation.isPending,
    deleteError: mutation.error,
  };
};
