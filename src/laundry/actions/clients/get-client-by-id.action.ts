import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client } from '@/laundry/interfaces/clients/clients.interface';
import { ApiResponse } from '@/interfaces/base.response';
import { extractAxiosError } from '@/helpers';

interface ClientResponse extends ApiResponse<Client> {}

/**
 * Obtiene un cliente por ID
 */
export const getClientByIdAction = async (id: string): Promise<Client> => {
  if (!id) throw new Error('ID de cliente no proporcionado');
  
  // Para nuevo cliente, retornar objeto vacío
  if (id === 'new') {
    return {
      id: 'new',
      name: '',
      email: '',
      identification_number: '',
      phone: '',
      address: '',
      acronym: '',
      branch_office_id: '',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Client;
  }
  
  try {
    const { data } = await clientsApi.get<ClientResponse>(`/${id}`);
    if (!data) throw new Error('Cliente no encontrado');
    return data.data!;
  } catch (error) {
    const { message } = extractAxiosError(error, 'Error al obtener el cliente');
    if (message) {
      throw new Error(message);
    }
    
    throw new Error(`Failed to fetch client: ${error}`);
  }
};

