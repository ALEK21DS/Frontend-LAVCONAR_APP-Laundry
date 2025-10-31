import { useMutation } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';

interface ScanGarmentQrDto {
  qr_data: string;
}

export const useScanGarmentQr = () => {
  const mutation = useMutation({
    mutationFn: async (qrData: string): Promise<any> => {
      const payload: ScanGarmentQrDto = { qr_data: qrData };
      const { data } = await garmentsApi.post('/scan-garment-qr', payload);
      return data.data ?? data; // soporta ambos envoltorios
    },
    onError: (err: any) => {
      console.error('Error al escanear QR de prenda:', err);
    },
  });

  return {
    scanGarmentQr: mutation.mutate,
    scanGarmentQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    scanError: mutation.error,
  };
};


