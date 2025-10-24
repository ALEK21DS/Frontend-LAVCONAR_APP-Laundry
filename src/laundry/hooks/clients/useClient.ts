import { useQuery } from '@tanstack/react-query';
import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener un cliente por ID
 */
export const useClient = (id: string | null | undefined) => {
  const {
    data: client,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['client', id],
    queryFn: async (): Promise<Client | undefined> => {
      if (!id || id === 'new') return undefined;
      const { data } = await clientsApi.get<ApiResponse<Client>>(`/${id}`);
      return data.data;
    },
    enabled: !!id && id !== 'new',
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    client,
    isLoading,
    error: error?.message,
    refetch,
  };
};

