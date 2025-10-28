import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener prendas por códigos RFID
 * Útil para validar múltiples códigos RFID a la vez
 */
export const useGarmentsByRfidCodes = (rfidCodes: string[], enabled = true) => {
  return useQuery({
    queryKey: ['garments-by-rfid-codes', rfidCodes],
    queryFn: async () => {
      const { data } = await guidesApi.post<ApiResponse<any[]>>('/get-garment-by-rfid-codes', {
        rfid_codes: rfidCodes  // Backend espera rfid_codes con guión bajo
      });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
    enabled: enabled && rfidCodes.length > 0,
  });
};

