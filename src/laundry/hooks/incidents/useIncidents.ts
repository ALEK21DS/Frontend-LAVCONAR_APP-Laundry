import { useQuery } from '@tanstack/react-query';
import { incidentsApi } from '@/laundry/api/incidents/incidents.api';
import { Incident } from '@/laundry/interfaces/incidents/incidents.interface';

interface BackendResponse {
  status: number;
  message: string;
  data: Incident[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface UseIncidentsParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_office_id?: string;
  incident_type?: string;
  incident_status?: string;
  action_taken?: string;
}

/**
 * Hook para obtener la lista de incidentes con paginación
 */
export const useIncidents = ({ 
  page = 1, 
  limit = 10,
  search,
  branch_office_id,
  incident_type,
  incident_status,
  action_taken,
}: UseIncidentsParams = {}) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['incidents', page, limit, search, branch_office_id, incident_type, incident_status, action_taken],
    queryFn: async (): Promise<BackendResponse> => {
      const response = await incidentsApi.get<BackendResponse>('/get-all-incidents', {
        params: { 
          page, 
          limit,
          ...(search && { search }),
          ...(branch_office_id && { branch_office_id }),
          ...(incident_type && { incident_type }),
          ...(incident_status && { incident_status }),
          ...(action_taken && { action_taken }),
        }
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  const incidents = data?.data || [];
  const total = data?.totalData || 0;
  const totalPages = data?.pagination?.totalPages || 0;
  const currentPage = data?.pagination?.page || page;

  return {
    incidents,
    total,
    totalPages,
    currentPage,
    isLoading,
    error: error?.message,
    refetch,
  };
};

