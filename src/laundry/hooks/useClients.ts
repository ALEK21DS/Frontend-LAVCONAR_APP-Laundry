import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientsApi } from '../api/clients/clients.api';
import { Client, CreateClientDto, UpdateClientDto } from '../interfaces/clients/clients.interface';
import { handleApiError } from '@/helpers/axios-error.helper';
import { ApiResponse } from '@/interfaces/base.response';

interface BackendResponse {
  status: number;
  message: string;
  data: Client[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const useClients = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['clients', page, limit],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await clientsApi.get<BackendResponse>('/', {
        params: { page, limit }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const clients = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const createClient = useMutation({
    mutationFn: async (clientData: CreateClientDto): Promise<Client> => {
      const { data } = await clientsApi.post<ApiResponse<Client>>('/', clientData);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al crear cliente:', handleApiError(err));
    },
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, data: clientData }: { id: string; data: UpdateClientDto }): Promise<Client> => {
      const { data } = await clientsApi.patch<ApiResponse<Client>>(`/${id}`, clientData);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al actualizar cliente:', handleApiError(err));
    },
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await clientsApi.delete(`/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: err => {
      console.error('Error al eliminar cliente:', handleApiError(err));
    },
  });

  return {
    clients,
    total,
    totalPages,
    currentPage: page,
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
    queryFn: async (): Promise<Client | undefined> => {
      if (!id) return undefined;
      const { data } = await clientsApi.get<ApiResponse<Client>>(`/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  return {
    client,
    isLoading,
    error: error?.message,
  };
};
