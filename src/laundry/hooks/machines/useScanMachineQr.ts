import { useMutation } from '@tanstack/react-query';
import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { Machine } from './useMachines';
import { ApiResponse } from '@/interfaces/base.response';

interface ScanMachineQrDto {
  qr_data: string;
}

/**
 * Hook para escanear código QR de máquina
 */
export const useScanMachineQr = () => {
  const mutation = useMutation({
    mutationFn: async (qrData: string): Promise<Machine> => {
      try {
        const payload: ScanMachineQrDto = { qr_data: qrData };
        const { data } = await washingProcessesApi.post<ApiResponse<Machine>>('/scan-machine-qr', payload);
        return data.data!;
      } catch (err: any) {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.message;
        if (status === 400 || status === 403) {
          // Crear un error personalizado que no se mostrará en la consola
          const accessError = new Error('Esta máquina no pertenece a tu sucursal');
          // Marcar el error para que no se muestre en la consola
          (accessError as any).isAccessError = true;
          throw accessError;
        }
        throw new Error(backendMsg || 'No se pudo escanear el código QR de la máquina');
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
        console.error('Error al escanear QR de máquina:', err);
      }
      // Para errores de acceso, silenciar completamente el error
    },
    // Configurar para que no muestre errores en la consola de React Query
    throwOnError: false,
  });

  return {
    scanMachineQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    error: mutation.error,
  };
};

