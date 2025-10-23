import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';
import { AxiosError } from 'axios';

interface GuidesResponse extends ApiResponse<Guide[]> {}

interface GetGuidesParams {
  page?: number;
  limit?: number;
  search?: string;
  branch_office_id?: string;
  status?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Obtiene la lista de guías con paginación y filtros
 */
export const getGuidesAction = async (
  filterParams: GetGuidesParams = {}
): Promise<GuidesResponse> => {
  try {
    const { data } = await guidesApi<GuidesResponse>({
      url: '/get-all-guides',
      method: 'GET',
      params: filterParams,
    });
    
    return data;
  } catch (error: any) {
    // Si es un error 404 (no encontrado), devolver respuesta vacía
    if (error instanceof AxiosError && error.response?.status === 404) {
      const { message } = extractAxiosError(error, 'Guías no encontradas');
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
    const { message } = extractAxiosError(error, 'Error al obtener las guías');
    if (message) {
      throw new Error(message);
    }
    throw new Error(`Failed to get guides: ${error}`);
  }
};

/**
 * Obtiene las guías de hoy
 */
export const getTodayGuidesAction = async (): Promise<Guide[]> => {
  try {
    const { data } = await guidesApi.get<ApiResponse<Guide[]>>('/today');
    return data.data || [];
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener guías de hoy');
    throw new Error(message);
  }
};
