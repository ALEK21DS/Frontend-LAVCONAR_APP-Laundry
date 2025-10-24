import { useMutation, useQueryClient } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment, UpdateGarmentDto } from '@/laundry/interfaces/garments/garments.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

interface UpdateGarmentParams {
  id: string;
  data: UpdateGarmentDto;
}

/**
 * Hook para actualizar una prenda existente
 */
export const useUpdateGarment = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data: garmentData }: UpdateGarmentParams): Promise<Garment> => {
      const { data } = await garmentsApi.patch<ApiResponse<Garment>>(`/update-garment/${id}`, garmentData);
      return data.data!;
    },
    onSuccess: (updatedGarment) => {
      // Invalidar queries de lista de prendas
      queryClient.invalidateQueries({ queryKey: ['garments'] });
      
      // Actualizar la prenda específica en el cache
      queryClient.invalidateQueries({ queryKey: ['garment', updatedGarment.id] });
    },
    onError: (err) => {
      console.error('Error al actualizar prenda:', handleApiError(err));
    },
  });

  return {
    updateGarment: mutation.mutate,
    updateGarmentAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
};

