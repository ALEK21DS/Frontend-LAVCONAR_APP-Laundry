import { useMutation } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';

interface ScanQrDto {
  qr_data: string;
}

/**
 * Hook para escanear código QR de una guía
 */
export const useScanQr = () => {
  const mutation = useMutation({
    mutationFn: async (qrData: string): Promise<Guide> => {
      const payload: ScanQrDto = { qr_data: qrData };
      const { data } = await guidesApi.post<ApiResponse<Guide>>('/scan-qr', payload);
      return data.data!;
    },
    onError: (err: any) => {
      console.error('Error al escanear QR:', err);
    },
  });

  return {
    scanQr: mutation.mutate,
    scanQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    scanError: mutation.error,
    scannedGuide: mutation.data,
  };
};

