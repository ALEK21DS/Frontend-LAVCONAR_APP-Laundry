import { useQuery } from '@tanstack/react-query';
import { rfidScansApi } from '@/laundry/api/guides/rfid-scans.api';
import { RfidScan, RfidScanFilters } from '@/laundry/interfaces/guides/rfid-scan.interface';
import { ApiResponse } from '@/interfaces/base.response';

interface UseRfidScansParams extends RfidScanFilters {
  enabled?: boolean;
}

/**
 * Hook para obtener la lista paginada de escaneos RFID
 */
export const useRfidScans = ({
  page = 1,
  limit = 10,
  search,
  guide_id,
  rfid_code,
  scan_type,
  enabled = true,
}: UseRfidScansParams = {}) => {
  return useQuery({
    queryKey: ['rfid-scans', { page, limit, search, guide_id, rfid_code, scan_type }],
    queryFn: async () => {
      const { data } = await rfidScansApi.get<ApiResponse<RfidScan[]>>('/get-all-rfid-scans', {
        params: {
          page,
          limit,
          search,
          guide_id,
          rfid_code,
          scan_type,
        }
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled,
  });
};

