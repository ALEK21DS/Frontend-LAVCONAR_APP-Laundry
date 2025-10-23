import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '../api/guides/guides.api';
import { Guide, CreateGuideDto, UpdateGuideStatusDto } from '../interfaces/guides/guides.interface';
import { handleApiError } from '@/helpers/axios-error.helper';
import { ApiResponse } from '@/interfaces/base.response';

interface BackendResponse {
  status: number;
  message: string;
  data: Guide[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const useGuides = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', page, limit],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await guidesApi.get<BackendResponse>('/get-all-guides', {
        params: { page, limit }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const guides = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const createGuide = useMutation({
    mutationFn: async (guideData: CreateGuideDto): Promise<Guide> => {
      const { data } = await guidesApi.post<ApiResponse<Guide>>('/', guideData);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
    onError: err => {
      console.error('Error al crear guía:', handleApiError(err));
    },
  });

  const updateGuideStatus = useMutation({
    mutationFn: async ({ id, data: statusData }: { id: string; data: UpdateGuideStatusDto }): Promise<Guide> => {
      const { data } = await guidesApi.patch<ApiResponse<Guide>>(`/${id}/status`, statusData);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
    onError: err => {
      console.error('Error al actualizar estado de guía:', handleApiError(err));
    },
  });

  return {
    guides,
    total,
    totalPages,
    currentPage: page,
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
    queryFn: async (): Promise<Guide[]> => {
      const response = await guidesApi.get<ApiResponse<Guide[]>>('/today');
      return response.data.data || [];
    },
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
