import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '@/laundry/api/tags/tags.api';
import { Tag, RegisterTagDto } from '@/laundry/interfaces/tags/tags.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { handleApiError } from '@/helpers/axios-error.helper';

/**
 * Hook para registrar un nuevo tag RFID
 */
export const useRegisterTag = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (tagData: RegisterTagDto): Promise<Tag> => {
      const { data } = await tagsApi.post<ApiResponse<Tag>>('/', tagData);
      return data.data!;
    },
    onSuccess: () => {
      // Invalidar queries de tags
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err) => {
      console.error('Error al registrar tag:', handleApiError(err));
    },
  });

  return {
    registerTag: mutation.mutate,
    registerTagAsync: mutation.mutateAsync,
    isRegistering: mutation.isPending,
    registerError: mutation.error,
    registerSuccess: mutation.isSuccess,
  };
};

