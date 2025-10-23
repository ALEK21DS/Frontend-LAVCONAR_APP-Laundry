export interface Client {
  id: string;
  name: string;
  email: string;
  identification_number: string;
  phone?: string;
  address?: string;
  acronym?: string;
  branch_office_id: string;
  branch_office_name?: string;
  status: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateClientDto {
  name: string;
  email: string;
  identification_number: string;
  phone: string;
  address: string;
  acronym: string;
  branch_office_id?: string; // Se asigna automáticamente desde el usuario autenticado
  // is_active se maneja por defecto en el backend
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  identification_number?: string;
  phone?: string;
  address?: string;
  acronym?: string;
  is_active?: boolean;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
}
