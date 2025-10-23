import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

interface GuideResponse extends ApiResponse<Guide> {}

/**
 * Obtiene una guía por ID
 */
export const getGuideByIdAction = async (id: string): Promise<Guide> => {
  if (!id) throw new Error('ID de guía no proporcionado');
  
  try {
    const { data } = await guidesApi.get<GuideResponse>(`/${id}`);
    if (!data) throw new Error('Guía no encontrada');
    return data.data!;
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener la guía');
    if (message) {
      throw new Error(message);
    }
    
    throw new Error(`Failed to fetch guide: ${error}`);
  }
};

