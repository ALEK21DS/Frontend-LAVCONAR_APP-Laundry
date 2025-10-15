import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '../api/guides/guides.api';
import { CreateGuideDto, UpdateGuideStatusDto } from '../interfaces/guides/guides.interface';
import { handleApiError } from '@/helpers/axios-error.helper';

export const useGuides = () => {
  const queryClient = useQueryClient();

  const {
    data: guides = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides'],
    queryFn: guidesApi.getAll,
    staleTime: 1000 * 60 * 5,
  });

  const createGuide = useMutation({
    mutationFn: (data: CreateGuideDto) => guidesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
    onError: err => {
      console.error('Error al crear guía:', handleApiError(err));
    },
  });

  const updateGuideStatus = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGuideStatusDto }) =>
      guidesApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
    onError: err => {
      console.error('Error al actualizar estado de guía:', handleApiError(err));
    },
  });

  return {
    guides,
    isLoading,
    error: error?.message,
    refetch,
    createGuide,
    updateGuideStatus,
  };
};

export const useTodayGuides = () => {
  const {
    data: guides = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', 'today'],
    queryFn: guidesApi.getTodayGuides,
    staleTime: 1000 * 60 * 1,
    refetchInterval: 1000 * 60 * 2,
  });

  return {
    guides,
    isLoading,
    error: error?.message,
    refetch,
  };
};
