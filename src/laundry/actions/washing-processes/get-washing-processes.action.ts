import { washingProcessesApi } from '@/laundry/api/washing-processes/washing-processes.api';
import { WashingProcessResponse, WashingProcessFilters } from '@/laundry/interfaces/washing-processes/washing-processes.interface';
import { extractAxiosError } from '@/helpers';
import { AxiosError } from 'axios';

/**
 * Obtiene la lista de procesos de lavado con paginación y filtros
 */
export const getWashingProcessesAction = async (
  filterParams: WashingProcessFilters = {}
): Promise<WashingProcessResponse> => {
  try {
    const { data } = await washingProcessesApi<WashingProcessResponse>({
      url: '/get-all-washing-processes',
      method: 'GET',
      params: filterParams,
    });
    
    return data;
  } catch (error: any) {
    // Si es un error 404 (no encontrado), devolver respuesta vacía
    if (error instanceof AxiosError && error.response?.status === 404) {
      const { message } = extractAxiosError(error, 'Procesos no encontrados');
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
    const { message } = extractAxiosError(error, 'Error al obtener los procesos');
    if (message) {
      throw new Error(message);
    }
    throw new Error(`Failed to get washing processes: ${error}`);
  }
};

