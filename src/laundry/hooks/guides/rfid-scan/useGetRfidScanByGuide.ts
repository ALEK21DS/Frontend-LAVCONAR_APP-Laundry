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
}

/**
 * Hook para obtener el escaneo RFID de una guía
 */
export const useGetRfidScanByGuide = (guideId: string, enabled: boolean = true) => {
  const query = useQuery({
    queryKey: ['rfid-scan', guideId],
    queryFn: async (): Promise<RfidScan | null> => {
      try {
        const { data } = await guidesApi.get<ApiResponse<RfidScan>>(`/get-rfid-scan-by-guide/${guideId}`);
        return data.data!;
      } catch (error: any) {
        // Si es 404, significa que no existe rfid_scan para esta guía (guía antigua o sin RFIDs)
        if (error.response?.status === 404) {
          return null; // Retornar null en lugar de throw para indicar "sin RFIDs"
        }
        throw error; // Solo lanzar error si es un error real (500, etc)
      }
    },
    enabled: enabled && !!guideId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false, // No reintentar en caso de error
  });

  return {
    rfidScan: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
};

