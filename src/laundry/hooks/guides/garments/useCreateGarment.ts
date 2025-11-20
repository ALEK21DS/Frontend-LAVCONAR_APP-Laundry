import { useMutation, useQueryClient } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment, CreateGarmentDto } from '@/laundry/interfaces/garments/garments.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para crear una nueva prenda
 * Nota: El backend espera un array de prendas, este hook envía un solo elemento
 */
export const useCreateGarment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (garmentData: CreateGarmentDto): Promise<Garment> => {
      // El backend espera un array de prendas
      const { data } = await garmentsApi.post<ApiResponse<Garment[]>>('/create-garments', [garmentData]);
      // Retornar la primera prenda creada
      return data.data![0];
    },
    onSuccess: () => {
      // Invalidar todas las queries de prendas para refrescar la lista
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      queryClient.invalidateQueries({ queryKey: ['garment'] });
    },
    onError: (err) => {
      // Error manejado en el componente que usa el hook
    },
  });

  return {
    createGarment: mutation.mutate,
    createGarmentAsync: mutation.mutateAsync,
    isCreating: mutation.isPending,
    createError: mutation.error,
    createSuccess: mutation.isSuccess,
  };
};

