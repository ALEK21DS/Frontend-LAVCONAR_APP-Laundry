import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '../../../api/guides/guides.api';
import type { ApiResponse } from '@/interfaces/base.response';

interface RfidScan {
  id: string;
  guide_id: string;
  branch_offices_id: string;
  scan_type: string;
  scanned_quantity: number;
  scanned_rfid_codes: string[];
  unexpected_codes: string[];
  user_id: string;
  location?: string;
  differences_detected?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Información adicional de la guía
  guide?: {
    id: string;
    guide_number: string;
    client_name?: string;
    service_type?: string;
    status?: string;
  };
}

interface GetAllRfidScansParams {
  page?: number;
  limit?: number;
  scan_type?: string;
  branch_office_id?: string;
  guide_id?: string[]; // Array de guide_ids para filtrar
}

/**
 * Hook para obtener todos los escaneos RFID
 */
export const useGetAllRfidScans = (params: GetAllRfidScansParams = {}) => {
  const {
    page = 1,
    limit = 50,
    scan_type,
    branch_office_id,
    guide_id,
  } = params;

  const query = useQuery({
    queryKey: ['rfid-scans', page, limit, scan_type, branch_office_id, guide_id],
    queryFn: async (): Promise<{ data: RfidScan[]; total: number; }> => {
      if (guide_id !== undefined && guide_id.length === 0) {
        return { data: [], total: 0 };
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (scan_type) {
        queryParams.append('scan_type', scan_type);
      }

      if (branch_office_id) {
        queryParams.append('branch_office_id', branch_office_id);
      }

      if (guide_id && guide_id.length > 0) {
        guide_id.forEach(id => {
          queryParams.append('guide_id', id);
        });
      }

      const { data } = await guidesApi.get<ApiResponse<RfidScan[]>>(
        `/get-all-rfid-scans?${queryParams.toString()}`
      );

      return {
        data: data.data || [],
        total: data.totalData || 0,
      };
    },
    staleTime: 0,
    gcTime: 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    refetchOnWindowFocus: true,
    enabled: guide_id === undefined || (guide_id !== undefined && guide_id.length > 0),
  });

  const rfidScans = Array.isArray(query.data)
    ? query.data
    : (query.data?.data || []);

  return {
    rfidScans,
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};
