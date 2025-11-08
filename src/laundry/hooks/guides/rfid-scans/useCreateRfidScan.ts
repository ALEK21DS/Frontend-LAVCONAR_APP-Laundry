import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { CreateRfidScanDto, RfidScan } from '@/laundry/interfaces/guides/rfid-scan.interface';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para crear un nuevo escaneo RFID
 */
export const useCreateRfidScan = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rfidScan: CreateRfidScanDto) => {
      const { data } = await guidesApi.post<ApiResponse<RfidScan>>('/create-rfid-scan', rfidScan);
      return data;
    },
    onSuccess: (response) => {
      const rfidScan = response.data;
      
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['rfid-scans'] });
      queryClient.invalidateQueries({ queryKey: ['rfid-scans-by-guide', { guideId: rfidScan?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guide', { id: rfidScan?.guide_id }] });
      queryClient.invalidateQueries({ queryKey: ['guides'] });
    },
  });

  return {
    createRfidScanAsync: mutation.mutateAsync,
    createRfidScan: mutation.mutate,
    isCreating: mutation.isPending,
    error: mutation.error,
  };
};

