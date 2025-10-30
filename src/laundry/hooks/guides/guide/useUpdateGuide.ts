import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import type { ApiResponse } from '@/interfaces/base.response';
import type { Guide } from '@/laundry/interfaces/guides/guides.interface';

export const useUpdateGuide = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Guide> }) => {
      const { data: resp } = await guidesApi.patch<ApiResponse<Guide>>(`/update-guide/${id}`, data);
      return resp.data!;
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['guides'] });
      queryClient.invalidateQueries({ queryKey: ['guide', { id: updated.id }] });
    },
  });

  return {
    updateGuideAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};


