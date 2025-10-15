import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients/clients.api';
import { CreateClientDto, UpdateClientDto } from '../interfaces/clients/clients.interface';
import { handleApiError } from '@/helpers/axios-error.helper';

export const useClients = () => {
  const queryClient = useQueryClient();

  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
    staleTime: 1000 * 60 * 5,
  });

  const createClient = useMutation({
    mutationFn: (data: CreateClientDto) => clientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al crear cliente:', handleApiError(err));
    },
  });

  const updateClient = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClientDto }) =>
      clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al actualizar cliente:', handleApiError(err));
    },
  });

  const deleteClient = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al eliminar cliente:', handleApiError(err));
    },
  });

  return {
    clients,
    isLoading,
    error: error?.message,
    refetch,
    createClient,
    updateClient,
    deleteClient,
  };
};

export const useClient = (id: string) => {
  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['clients', id],
    queryFn: () => clientsApi.getById(id),
    enabled: !!id,
  });

  return {
    client,
    isLoading,
    error: error?.message,
  };
};
