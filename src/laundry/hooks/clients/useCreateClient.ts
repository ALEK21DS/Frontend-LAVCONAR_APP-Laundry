import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client, CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para crear un nuevo cliente
 */
export const useCreateClient = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (clientData: CreateClientDto): Promise<Client> => {
      const { data } = await clientsApi.post<ApiResponse<Client>>('/', clientData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar todas las queries de clientes para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (err) => {
      console.error('Error al crear cliente:', handleApiError(err));
    },
  });

  return {
    createClient: mutation.mutate,
    createClientAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
    createSuccess: mutation.isSuccess,
  };
};

