import { guidesApi } from '@/laundry/api/guides/guides.api';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

/**
 * Elimina una guía por ID
 */
export const deleteGuideByIdAction = async (id: string): Promise<void> => {
  if (!id || id === 'new') {
    throw new Error('ID de guía no válido');
  }
  
  try {
    await guidesApi.delete<ApiResponse<void>>(`/${id}`);
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al eliminar la guía');
    throw new Error(message);
  }
};

