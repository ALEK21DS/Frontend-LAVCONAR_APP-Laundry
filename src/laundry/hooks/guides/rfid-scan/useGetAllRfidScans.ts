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
  } = params;

  const query = useQuery({
    queryKey: ['rfid-scans', page, limit, scan_type, branch_office_id],
    queryFn: async (): Promise<{ data: RfidScan[]; total: number; }> => {
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

      const { data } = await guidesApi.get<ApiResponse<RfidScan[]>>(
        `/get-all-rfid-scans?${queryParams.toString()}`
      );

      return {
        data: data.data || [],
        total: data.totalData || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  // Si query.data es un array directamente (caché viejo), usarlo directamente
  const rfidScans = Array.isArray(query.data) 
    ? query.data 
    : (query.data?.data || []);

  return {
    rfidScans: rfidScans,
    total: query.data?.total || 0,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

