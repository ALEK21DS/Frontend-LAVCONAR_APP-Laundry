import { useQuery } from '@tanstack/react-query';
import { rfidScansApi } from '@/laundry/api/guides/rfid-scans.api';
import { RfidScan } from '@/laundry/interfaces/guides/rfid-scan.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener un escaneo RFID específico por ID
 */
export const useRfidScan = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['rfid-scan', { id }],
    queryFn: async () => {
      const { data } = await rfidScansApi.get<ApiResponse<RfidScan>>(`/get-rfid-scan/${id}`);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled: enabled && !!id,
  });
};

