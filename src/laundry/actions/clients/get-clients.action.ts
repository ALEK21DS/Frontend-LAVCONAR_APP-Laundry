import { clientsApi } from '@/laundry/api/clients/clients.api';
import { Client } from '@/laundry/interfaces/clients/clients.interface';

export const getClientsAction = async (): Promise<Client[]> => {
  return await clientsApi.getAll();
};

export const getClientByIdAction = async (id: string): Promise<Client> => {
  return await clientsApi.getById(id);
};

export const searchClientsAction = async (query: string): Promise<Client[]> => {
  return await clientsApi.search(query);
};
