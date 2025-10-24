import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/laundry/api/tags/tags.api';
import { Tag, UpdateTagDto } from '@/laundry/interfaces/tags/tags.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

interface UpdateTagParams {
  epc: string;
  data: UpdateTagDto;
}

/**
 * Hook para actualizar un tag RFID existente
 */
export const useUpdateTag = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ epc, data: tagData }: UpdateTagParams): Promise<Tag> => {
      const { data } = await tagsApi.patch<ApiResponse<Tag>>(`/${epc}`, tagData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar queries de tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err) => {
      console.error('Error al actualizar tag:', handleApiError(err));
    },
  });

  return {
    updateTag: mutation.mutate,
    updateTagAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    updateSuccess: mutation.isSuccess,
  };
};

