import { useMutation } from '@tanstack/react-query';
import { vehiclesApi } from '@/laundry/api/vehicles/vehicles.api';
import { Vehicle } from '@/laundry/interfaces/vehicles/vehicle.interface';
import { ApiResponse } from '@/interfaces/base.response';

interface ScanVehicleQrDto {
  qr_data: string;
}

/**
 * Hook para escanear código QR de vehículo
 */
export const useScanVehicleQr = () => {
  const mutation = useMutation({
    mutationFn: async (qrData: string): Promise<Vehicle> => {
      try {
        const payload: ScanVehicleQrDto = { qr_data: qrData };
        const { data } = await vehiclesApi.post<ApiResponse<Vehicle>>('/scan-qr', payload);
        return data.data!;
      } catch (error: any) {
        // Manejar error de sucursal
        if (error.response?.status === 400) {
          const errorMessage = error.response?.data?.message || '';
          if (errorMessage.toLowerCase().includes('sucursal') || 
              errorMessage.toLowerCase().includes('branch')) {
            throw new Error('Ese vehículo no pertenece a esta sucursal');
          }
        }
        throw error;
      }
    },
    onError: (err: any) => {
      console.error('Error escaneando QR de vehículo:', err);
    },
  });

  return {
    scanVehicleQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    error: mutation.error,
  };
};

