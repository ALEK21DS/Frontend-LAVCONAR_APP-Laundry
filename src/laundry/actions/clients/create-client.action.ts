import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client, CreateClientDto } from '@/laundry/interfaces/clients/clients.interface';

export const createClientAction = async (data: CreateClientDto): Promise<Client> => {
  return await clientsApi.create(data);
};
