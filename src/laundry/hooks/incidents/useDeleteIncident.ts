import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/laundry/api/incidents/incidents.api';

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await incidentsApi.delete(`/delete-incident/${id}`);
    },
    onSuccess: (_, incidentId) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.removeQueries({ queryKey: ['incident', incidentId] });
    },
  });

  return {
    deleteIncident: mutation.mutate,
    deleteIncidentAsync: mutation.mutateAsync,
    isDeletingIncident: mutation.isPending,
    deleteIncidentError: mutation.error,
  };
};
