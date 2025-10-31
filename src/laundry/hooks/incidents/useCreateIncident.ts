import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/laundry/api/incidents/incidents.api';
import { Incident, CreateIncidentDto } from '@/laundry/interfaces/incidents/incidents.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para crear un nuevo incidente
 */
export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (incidentData: CreateIncidentDto): Promise<Incident> => {
      const { data } = await incidentsApi.post<ApiResponse<Incident>>('/create-incident', incidentData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar todas las queries de incidentes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
    onError: () => {
      // El manejo del error se realiza en el componente que invoca mutateAsync
    },
  });

  return {
    createIncident: mutation.mutate,
    createIncidentAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
    createSuccess: mutation.isSuccess,
  };
};

