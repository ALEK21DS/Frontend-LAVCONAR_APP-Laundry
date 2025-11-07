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
      try {
      const payload: ScanQrDto = { qr_data: qrData };
      const { data } = await guidesApi.post<ApiResponse<Guide>>('/scan-qr', payload);
      return data.data!;
      } catch (err: any) {
        const status = err?.response?.status;
        const backendMsg = err?.response?.data?.message;
        if (status === 400 || status === 403) {
          // Crear un error personalizado que no se mostrará en la consola
          const accessError = new Error('No tienes acceso a esta guía');
          // Marcar el error para que no se muestre en la consola
          (accessError as any).isAccessError = true;
          throw accessError;
        }
        throw new Error(backendMsg || 'No se pudo escanear el código QR');
      }
    },
    onError: (err: any) => {
      // No mostrar ningún error en consola para errores de acceso (400/403)
      // Estos errores se manejan con Alert en los componentes
      const status = err?.response?.status;
      const errorMessage = err?.message || '';
      const isAccessError = err?.isAccessError || status === 400 || status === 403 || errorMessage.includes('No tienes acceso');
      
      // Solo mostrar error en consola si NO es un error de acceso
      if (!isAccessError) {
      console.error('Error al escanear QR:', err);
      }
      // Para errores de acceso, silenciar completamente el error
    },
    // Configurar para que no muestre errores en la consola de React Query
    throwOnError: false,
  });

  return {
    scanQr: mutation.mutate,
    scanQrAsync: mutation.mutateAsync,
    isScanning: mutation.isPending,
    scanError: mutation.error,
    scannedGuide: mutation.data,
  };
};

