import { useMutation } from '@tanstack/react-query';
import { garmentsApi } from '@/laundry/api/garments/garments.api';

interface ScanGarmentQrDto {
  qr_data: string;
}

export const useScanGarmentQr = () => {
  const mutation = useMutation({
    mutationFn: async (qrData: string): Promise<any> => {
      try {
        const payload: ScanGarmentQrDto = { qr_data: qrData };
        const { data } = await garmentsApi.post('/scan-garment-qr', payload);
        return data.data ?? data; // soporta ambos envoltorios
      } catch (err: any) {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.message;
        if (status === 400 || status === 403) {
          throw new Error('Esta prenda no pertenece a tu sucursal');
        }
        throw new Error(backendMsg || 'No se pudo escanear el código QR de la prenda');
      }
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


