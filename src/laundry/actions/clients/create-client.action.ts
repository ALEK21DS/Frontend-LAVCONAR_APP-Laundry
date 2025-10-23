import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client, CreateClientDto, UpdateClientDto } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

/**
 * Crea o actualiza un cliente
 */
export const createUpdateClientAction = async (
  clientData: Partial<Client>,
  id?: string
): Promise<Client> => {
  try {
    const { id: _, branch_office_name, ...rest } = clientData as any;
    
    const isCreating = id === 'new' || !id;
    
    const { data } = await clientsApi<ApiResponse<Client>>({
      url: isCreating ? '/' : `/${id}`,
      method: isCreating ? 'POST' : 'PATCH',
      data: rest,
    });
    
    return data.data!;
  } catch (error) {
    const { message } = extractAxiosError(
      error,
      `Error al ${id ? 'actualizar' : 'crear'} el cliente`
    );
    throw new Error(message);
  }
};
