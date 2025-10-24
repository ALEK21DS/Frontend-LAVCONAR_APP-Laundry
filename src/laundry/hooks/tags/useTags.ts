import { useQuery } from '@tanstack/react-query';
import { tagsApi } from '@/laundry/api/tags/tags.api';
import { Tag } from '@/laundry/interfaces/tags/tags.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener todos los tags RFID
 */
export const useTags = () => {
  const {
    data: tags = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const response = await tagsApi.get<ApiResponse<Tag[]>>('/');
      return response.data.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    tags,
    isLoading,
    error: error?.message,
    refetch,
  };
};

