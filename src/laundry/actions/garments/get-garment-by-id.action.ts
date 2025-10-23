import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment } from '@/laundry/interfaces/garments/garments.interface';
import { extractAxiosError } from '@/helpers';

/**
 * Obtiene una prenda por ID
 */
export const getGarmentByIdAction = async (id: string): Promise<Garment> => {
  if (!id) throw new Error('ID de prenda no proporcionado');
  
  try {
    const { data } = await garmentsApi.get<{ data: Garment }>(`/garments/${id}`);
    if (!data) throw new Error('Prenda no encontrada');
    return data.data;
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener la prenda');
    if (message) {
      throw new Error(message);
    }
    
    throw new Error(`Failed to fetch garment: ${error}`);
  }
};

