import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '../../../api/guides/guides.api';
import type { ApiResponse } from '@/interfaces/base.response';

interface RfidScan {
  id: string;
  guide_id: string;
  branch_offices_id: string;
  scan_type: string;
  scanned_quantity: number;
  scanned_rfid_codes: string[];
  unexpected_codes?: string[];
  user_id: string;
  location?: string;
  differences_detected?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface UpdateRfidScanParams {
  id: string;
  data: {
    guide_id: string;
    branch_offices_id: string;
    scan_type: string;
    scanned_quantity: number;
    scanned_rfid_codes: string[];
    unexpected_codes?: string[];
    differences_detected?: string;
  };
}

/**
 * Hook para actualizar un escaneo RFID
 */
export const useUpdateRfidScan = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data: scanData }: UpdateRfidScanParams): Promise<RfidScan> => {
      const { data } = await guidesApi.patch<ApiResponse<RfidScan>>(`/update-rfid-scan/${id}`, scanData);
      return data.data!;
    },
    onSuccess: (updatedRfidScan) => {
      // Invalidar y refrescar TODAS las queries de guías y RFID scans
      queryClient.invalidateQueries({ queryKey: ['guides'] });
      queryClient.invalidateQueries({ queryKey: ['guide', updatedRfidScan.guide_id] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scan', updatedRfidScan.guide_id] });
      
      // Forzar la recarga de TODAS las listas de RFID scans (incluyendo todos los scan_type)
      queryClient.refetchQueries({ 
        queryKey: ['rfid-scans'],
        type: 'all' 
      });
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.message || err.message || 'Error al actualizar escaneo RFID';
      throw new Error(errorMessage);
    },
  });

  return {
    updateRfidScanAsync: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};

