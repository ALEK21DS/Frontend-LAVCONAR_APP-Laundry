import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { guidesApi } from '@/laundry/api/guides/guides.api';
import { ApiResponse } from '@/interfaces/base.response';

/**
 * Hook para obtener prendas por códigos RFID
 * Útil para validar múltiples códigos RFID a la vez
 */
export const useGarmentsByRfidCodes = (rfidCodes: string[], enabled = true) => {
  // Normalizar códigos RFID antes de enviarlos (trim y mayúsculas)
  const normalizedRfidCodes = React.useMemo(() => {
    return rfidCodes.map(code => code?.trim().toUpperCase() || '').filter(code => code !== '');
  }, [rfidCodes]);
  
  return useQuery({
    queryKey: ['garments-by-rfid-codes', normalizedRfidCodes],
    queryFn: async () => {
      if (normalizedRfidCodes.length === 0) {
        return { data: [], status: 'success', message: '' };
      }
      
      const response = await guidesApi.post<ApiResponse<any[]>>('/get-garment-by-rfid-codes', {
        rfid_codes: normalizedRfidCodes  // Backend espera rfid_codes con guión bajo
      });
      
      // Debug: Log de la respuesta
      console.log('📦 useGarmentsByRfidCodes - Respuesta del backend:', {
        normalizedRfidCodes,
        responseStatus: response.status,
        responseData: response.data,
        garmentsCount: response.data?.data?.length || 0,
        sampleGarments: response.data?.data?.slice(0, 2)?.map((g: any) => ({
          id: g.id,
          rfid_code: g.rfid_code,
          description: g.description,
        })),
      });
      
      return response.data;
    },
    staleTime: 0,
    gcTime: 1000,
    refetchOnMount: 'always',
    refetchOnReconnect: 'always',
    retry: false,
    enabled: enabled && normalizedRfidCodes.length > 0,
  });
};

