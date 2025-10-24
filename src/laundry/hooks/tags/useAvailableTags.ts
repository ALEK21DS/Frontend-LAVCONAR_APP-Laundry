import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/laundry/api/tags/tags.api';
import { Tag } from '@/laundry/interfaces/tags/tags.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener tags RFID disponibles (no asignados)
 */
export const useAvailableTags = () => {
  const {
    data: tags = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tags', 'available'],
    queryFn: async (): Promise<Tag[]> => {
      const response = await tagsApi.get<ApiResponse<Tag[]>>('/available');
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutos (más frecuente porque cambia rápido)
  });

  return {
    tags,
    isLoading,
    error: error?.message,
    refetch,
  };
};

