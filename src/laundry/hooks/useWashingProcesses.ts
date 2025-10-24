import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWashingProcessesAction } from '@/laundry/actions/washing-processes/get-washing-processes.action';
import { getWashingProcessByIdAction } from '@/laundry/actions/washing-processes/get-washing-process-by-id.action';
import { 
  WashingProcessFilters, 
  WashingProcess 
} from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { Alert } from 'react-native';

/**
 * Hook para obtener la lista de procesos de lavado con paginación y filtros
 */
export const useWashingProcesses = (filters: WashingProcessFilters = {}) => {
  const queryResult = useQuery({
    queryKey: ['washing-processes', filters],
    queryFn: async () => {
      const response = await getWashingProcessesAction(filters);
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    washingProcesses: queryResult.data?.data || [],
    total: queryResult.data?.totalData || 0,
    totalPages: queryResult.data?.pagination?.totalPages || 0,
    currentPage: queryResult.data?.pagination?.page || 1,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};

/**
 * Hook para obtener un proceso de lavado por ID
 */
export const useWashingProcessById = (processId: string) => {
  return useQuery({
    queryKey: ['washing-process', processId],
    queryFn: async () => {
      const response = await getWashingProcessByIdAction(processId);
      return response.data;
    },
    enabled: !!processId,
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * Hook para crear un proceso de lavado
 */
export const useCreateWashingProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (processData: any) => {
      // Esta función se implementará cuando se conecte el endpoint de creación
      throw new Error('Create washing process not implemented yet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      Alert.alert('Éxito', 'Proceso creado correctamente');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Error al crear el proceso');
    },
  });
};

/**
 * Hook para actualizar un proceso de lavado
 */
export const useUpdateWashingProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, processData }: { id: string; processData: any }) => {
      // Esta función se implementará cuando se conecte el endpoint de actualización
      throw new Error('Update washing process not implemented yet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      queryClient.invalidateQueries({ queryKey: ['washing-process'] });
      Alert.alert('Éxito', 'Proceso actualizado correctamente');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Error al actualizar el proceso');
    },
  });
};

/**
 * Hook para eliminar un proceso de lavado
 */
export const useDeleteWashingProcess = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Esta función se implementará cuando se conecte el endpoint de eliminación
      throw new Error('Delete washing process not implemented yet');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['washing-processes'] });
      Alert.alert('Éxito', 'Proceso eliminado correctamente');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Error al eliminar el proceso');
    },
  });
};

