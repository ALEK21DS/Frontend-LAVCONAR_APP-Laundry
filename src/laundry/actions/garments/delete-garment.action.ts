import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { extractAxiosError } from '@/helpers';

/**
 * Elimina una prenda por ID
 */
export const deleteGarmentByIdAction = async (id: string): Promise<void> => {
  if (!id || id === 'new') {
    throw new Error('ID de prenda no válido');
  }
  
  try {
    await garmentsApi.delete<void>(`/garments/${id}`);
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al eliminar la prenda');
    throw new Error(message);
  }
};

