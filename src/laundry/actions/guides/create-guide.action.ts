import { guidesApi } from '@/laundry/api/guides/guides.api';
import { Guide, CreateGuideDto, UpdateGuideStatusDto } from '@/laundry/interfaces/guides/guides.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

/**
 * Crea o actualiza una guía
 */
export const createUpdateGuideAction = async (
  guideData: Partial<Guide>,
  id?: string
): Promise<Guide> => {
  try {
    const { id: _, ...rest } = guideData as any;
    
    const isCreating = id === 'new' || !id;
    
    const { data } = await guidesApi<ApiResponse<Guide>>({
      url: isCreating ? '/' : `/${id}`,
      method: isCreating ? 'POST' : 'PATCH',
      data: rest,
    });
    
    return data.data!;
  } catch (error) {
    const { message } = extractAxiosError(
      error,
      `Error al ${id ? 'actualizar' : 'crear'} la guía`
    );
    throw new Error(message);
  }
};

/**
 * Actualiza el estado de una guía
 */
export const updateGuideStatusAction = async (
  id: string,
  statusData: UpdateGuideStatusDto
): Promise<Guide> => {
  if (!id) throw new Error('ID de guía no proporcionado');
  
  try {
    const { data } = await guidesApi.patch<ApiResponse<Guide>>(
      `/${id}/status`,
      statusData
    );
    return data.data!;
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al actualizar el estado de la guía');
    throw new Error(message);
  }
};
