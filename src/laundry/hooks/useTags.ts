import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagsApi } from '../api/tags/tags.api';
import { RegisterTagDto, UpdateTagDto } from '../interfaces/tags/tags.interface';
import { handleApiError } from '@/helpers/axios-error.helper';

export const useTags = () => {
  const queryClient = useQueryClient();

  const {
    data: tags = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: tagsApi.getAll,
    staleTime: 1000 * 60 * 5,
  });

  const registerTag = useMutation({
    mutationFn: (data: RegisterTagDto) => tagsApi.register(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: err => {
      console.error('Error al registrar tag:', handleApiError(err));
    },
  });

  const updateTag = useMutation({
    mutationFn: ({ epc, data }: { epc: string; data: UpdateTagDto }) => tagsApi.update(epc, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: err => {
      console.error('Error al actualizar tag:', handleApiError(err));
    },
  });

  const deleteTag = useMutation({
    mutationFn: (epc: string) => tagsApi.delete(epc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: err => {
      console.error('Error al eliminar tag:', handleApiError(err));
    },
  });

  return {
    tags,
    isLoading,
    error: error?.message,
    refetch,
    registerTag,
    updateTag,
    deleteTag,
  };
};
