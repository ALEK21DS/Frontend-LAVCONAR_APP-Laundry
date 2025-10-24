import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rfidScansApi } from '@/laundry/api/guides/rfid-scans.api';
import { UpdateRfidScanDto, RfidScan } from '@/laundry/interfaces/guides/rfid-scan.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para actualizar un escaneo RFID existente
 */
export const useUpdateRfidScan = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRfidScanDto }) => {
      const response = await rfidScansApi.patch<ApiResponse<RfidScan>>(`/update-rfid-scan/${id}`, data);
      return response.data;
    },
    onSuccess: (response) => {
      const rfidScan = response.data;
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['rfid-scan', { id: rfidScan?.id }] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scans'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scans-by-guide', { guideId: rfidScan?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guide', { id: rfidScan?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    updateRfidScanAsync: mutation.mutateAsync,
    updateRfidScan: mutation.mutate,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
};

