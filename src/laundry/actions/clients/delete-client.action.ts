import { clientsApi } from '@/laundry/api/clients/clients.api';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

/**
 * Elimina un cliente por ID
 */
export const deleteClientByIdAction = async (id: string): Promise<void> => {
  if (!id || id === 'new') {
    throw new Error('ID de cliente no válido');
  }
  
  try {
    await clientsApi.delete<ApiResponse<void>>(`/${id}`);
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al eliminar el cliente');
    throw new Error(message);
  }
};

