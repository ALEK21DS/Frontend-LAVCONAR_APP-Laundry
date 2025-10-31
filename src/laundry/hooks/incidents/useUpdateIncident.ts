import { useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsApi } from '@/laundry/api/incidents/incidents.api';
import { Incident, UpdateIncidentDto } from '@/laundry/interfaces/incidents/incidents.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para actualizar un incidente existente
 */
export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateIncidentDto }): Promise<Incident> => {
      const { data: response } = await incidentsApi.patch<ApiResponse<Incident>>(`/update-incident/${id}`, data);
      return response.data!;
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
    updateIncident: mutation.mutate,
    updateIncidentAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
};

