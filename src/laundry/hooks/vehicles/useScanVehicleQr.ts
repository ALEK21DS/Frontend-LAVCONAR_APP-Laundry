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
      } catch (err: any) {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.message;
        if (status === 400 || status === 403) {
          // Crear un error personalizado que no se mostrará en la consola
          const accessError = new Error('Este vehículo no pertenece a tu sucursal');
          // Marcar el error para que no se muestre en la consola
          (accessError as any).isAccessError = true;
          throw accessError;
        }
        throw new Error(backendMsg || 'No se pudo escanear el código QR del vehículo');
      }
    },
    onError: (err: any) => {
      // No mostrar ningún error en consola para errores de acceso (400/403)
      // Estos errores se manejan con Alert en los componentes
      const status = err?.response?.status;
      const errorMessage = err?.message || '';
      const isAccessError = err?.isAccessError || status === 400 || status === 403 || errorMessage.includes('no pertenece a tu sucursal');
      
      // Solo mostrar error en consola si NO es un error de acceso
      if (!isAccessError) {
        console.error('Error al escanear QR de vehículo:', err);
      }
      // Para errores de acceso, silenciar completamente el error
    },
    // Configurar para que no muestre errores en la consola de React Query
    throwOnError: false,
  });

  return {
    scanVehicleQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    error: mutation.error,
  };
};

