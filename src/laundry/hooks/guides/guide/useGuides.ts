import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';

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

interface UseGuidesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  service_type?: 'INDUSTRIAL' | 'PERSONAL';
  branch_office_id?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener la lista paginada de guías
 */
export const useGuides = ({
  page = 1,
  limit = 10,
  search,
  status,
  service_type,
  branch_office_id,
  enabled = true
}: UseGuidesParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['guides', { page, limit, search, status, service_type, branch_office_id }],
    queryFn: async (): Promise<BackendResponse> => {
      const params: any = {
        page,
        limit,
      };
      
      if (search) {
        params.search = search;
      }
      
      // Solo enviar service_type si tiene un valor válido
      if (service_type) {
        params.service_type = service_type;
      }

      if (branch_office_id) {
        params.branch_office_id = branch_office_id;
      }
      
      try {
        const response = await guidesApi.get<BackendResponse>('/get-all-guides', {
          params,
        });
        
        // El filtrado por status ahora se hace en el backend si se envía como parámetro
        // No filtramos en frontend para evitar problemas con guías únicas
        return response.data;
      } catch (error: any) {
        // Si es un 404 (no encontrado), devolver respuesta vacía en lugar de error
        if (error?.response?.status === 404) {
          return {
            status: 200,
            message: 'No se encontraron guías',
            data: [],
            totalData: 0,
            pagination: {
              page: page,
              limit: limit,
              totalPages: 0,
            },
            timestamp: new Date().toISOString(),
          };
        }
        
        throw error;
      }
    },
    staleTime: 0,
    gcTime: 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: true,
    retry: false,
    enabled,
  });

  const guides = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || page;

  return {
    guides,
    total,
    totalPages,
    currentPage,
    isLoading,
    error: error?.message,
    refetch,
  };
};
