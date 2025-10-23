import { garmentsApi } from '@/laundry/api/garments/garments.api';
import { Garment, CreateGarmentDto } from '@/laundry/interfaces/garments/garments.interface';
import { extractAxiosError } from '@/helpers';

/**
 * Crea o actualiza una prenda
 */
export const createUpdateGarmentAction = async (
  garmentData: Partial<Garment>,
  id?: string
): Promise<Garment> => {
  try {
    const { id: _, ...rest } = garmentData as any;
    
    const isCreating = id === 'new' || !id;
    
    const { data } = await garmentsApi<{ data: any }>({
      url: isCreating ? '/create-garments' : `/update-garment/${id}`,
      method: isCreating ? 'POST' : 'PATCH',
      data: isCreating ? [rest] : rest, // Array para crear, objeto para actualizar
    });
    
    // Si es creación, retornar el primer elemento del array
    return isCreating ? data.data[0] : data.data;
  } catch (error) {
    const { message } = extractAxiosError(
      error,
      `Error al ${id ? 'actualizar' : 'crear'} la prenda`
    );
    throw new Error(message);
  }
};

