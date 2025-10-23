import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { garmentsApi } from '../api/garments/garments.api';
import { Garment, CreateGarmentDto, UpdateGarmentDto } from '../interfaces/garments/garments.interface';
import { handleApiError } from '@/helpers/axios-error.helper';
import { ApiResponse } from '@/interfaces/base.response';

interface BackendResponse {
  status: number;
  message: string;
  data: Garment[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export const useGarments = (page: number = 1, limit: number = 10) => {
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['garments', page, limit],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await garmentsApi.get<BackendResponse>('/get-all-garments', {
        params: { page, limit }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const garments = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;

  const createGarment = useMutation({
    mutationFn: async (garmentData: CreateGarmentDto): Promise<Garment> => {
      // El backend espera un array de prendas
      const { data } = await garmentsApi.post<ApiResponse<Garment[]>>('/create-garments', [garmentData]);
      // Retornar la primera prenda creada
      return data.data![0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
    },
    onError: err => {
      console.error('Error al crear prenda:', handleApiError(err));
    },
  });

  const updateGarment = useMutation({
    mutationFn: async ({ id, data: garmentData }: { id: string; data: UpdateGarmentDto }): Promise<Garment> => {
      const { data } = await garmentsApi.patch<ApiResponse<Garment>>(`/update-garment/${id}`, garmentData);
      return data.data!;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
    },
    onError: err => {
      console.error('Error al actualizar prenda:', handleApiError(err));
    },
  });

  const deleteGarment = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await garmentsApi.delete(`/garments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garments'] });
    },
    onError: err => {
      console.error('Error al eliminar prenda:', handleApiError(err));
    },
  });

  return {
    garments,
    total,
    totalPages,
    currentPage: page,
    isLoading,
    error: error?.message,
    refetch,
    createGarment,
    updateGarment,
    deleteGarment,
  };
};

export const useGarment = (id: string) => {
  const {
    data: garment,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['garments', id],
    queryFn: async (): Promise<Garment | undefined> => {
      if (!id) return undefined;
      const { data } = await garmentsApi.get<ApiResponse<Garment>>(`/garments/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  return {
    garment,
    isLoading,
    error: error?.message,
  };
};

