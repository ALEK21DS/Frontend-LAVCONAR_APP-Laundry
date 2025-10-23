import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment } from '@/laundry/interfaces/garments/garments.interface';
import { extractAxiosError } from '@/helpers';
import { AxiosError } from 'axios';

interface GarmentsResponse {
  status: number;
  message: string;
  data: Garment[];
  totalData?: number;
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

interface GetGarmentsParams {
  page?: number;
  limit?: number;
  search?: string;
  rfid_code?: string[];
}

/**
 * Obtiene la lista de prendas con paginación y filtros
 */
export const getGarmentsAction = async (
  filterParams: GetGarmentsParams = {}
): Promise<GarmentsResponse> => {
  try {
    const { data } = await garmentsApi<GarmentsResponse>({
      url: '/get-all-garments',
      method: 'GET',
      params: filterParams,
    });
    
    return data;
  } catch (error: any) {
    // Si es un error 404 (no encontrado), devolver respuesta vacía
    if (error instanceof AxiosError && error.response?.status === 404) {
      const { message } = extractAxiosError(error, 'Prendas no encontradas');
      return {
        status: 404,
        message,
        data: [],
        totalData: 0,
        pagination: {
          page: filterParams.page || 1,
          limit: filterParams.limit || 10,
          totalPages: 0,
        },
        timestamp: new Date().toISOString(),
      };
    }
    
    // Para otros errores, lanzar el error normalmente
    const { message } = extractAxiosError(error, 'Error al obtener las prendas');
    if (message) {
      throw new Error(message);
    }
    throw new Error(`Failed to get garments: ${error}`);
  }
};

/**
 * Obtiene prendas por códigos RFID
 */
export const getGarmentsByRfidCodesAction = async (
  rfidCodes: string[]
): Promise<Garment[]> => {
  if (!rfidCodes || rfidCodes.length === 0) {
    throw new Error('Códigos RFID no proporcionados');
  }
  
  try {
    const { data } = await garmentsApi.get<GarmentsResponse>('/get-all-garments', {
      params: { rfid_code: rfidCodes },
    });
    return data.data || [];
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener prendas por RFID');
    throw new Error(message);
  }
};

