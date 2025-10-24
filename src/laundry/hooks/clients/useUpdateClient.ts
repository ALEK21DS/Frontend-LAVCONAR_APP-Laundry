import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client, UpdateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

interface UpdateClientParams {
  id: string;
  data: UpdateClientDto;
}

/**
 * Hook para actualizar un cliente existente
 */
export const useUpdateClient = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data: clientData }: UpdateClientParams): Promise<Client> => {
      const { data } = await clientsApi.patch<ApiResponse<Client>>(`/${id}`, clientData);
      return data.data!;
    },
    onSuccess: (updatedClient) => {
      // Invalidar queries de lista de clientes
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Actualizar el cliente específico en el cache
      queryClient.invalidateQueries({ queryKey: ['client', updatedClient.id] });
    },
    onError: (err) => {
      console.error('Error al actualizar cliente:', handleApiError(err));
    },
  });

  return {
    updateClient: mutation.mutate,
    updateClientAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
};

