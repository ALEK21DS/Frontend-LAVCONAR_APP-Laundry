import { useQuery } from '@tanstack/react-query';
import { rfidScansApi } from '@/laundry/api/guides/rfid-scans.api';
import { RfidScan } from '@/laundry/interfaces/guides/rfid-scan.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener todos los escaneos RFID de una guía específica
 */
export const useRfidScansByGuide = (guideId: string, enabled = true) => {
  return useQuery({
    queryKey: ['rfid-scans-by-guide', { guideId }],
    queryFn: async () => {
      const { data } = await rfidScansApi.get<ApiResponse<RfidScan[]>>(`/get-rfid-scan-by-guide/${guideId}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled: enabled && !!guideId,
  });
};

