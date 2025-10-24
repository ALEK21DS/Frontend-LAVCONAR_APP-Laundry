import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '@/laundry/api/clients/clients.api';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para eliminar un cliente
 */
export const useDeleteClient = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await clientsApi.delete(`/${id}`);
    },
    onSuccess: (_, deletedId) => {
      // Invalidar todas las queries de clientes
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      
      // Remover el cliente específico del cache
      queryClient.removeQueries({ queryKey: ['client', deletedId] });
    },
    onError: (err) => {
      console.error('Error al eliminar cliente:', handleApiError(err));
    },
  });

  return {
    deleteClient: mutation.mutate,
    deleteClientAsync: mutation.mutateAsync,
    isDeleting: mutation.isPending,
    deleteError: mutation.error,
    deleteSuccess: mutation.isSuccess,
  };
};

