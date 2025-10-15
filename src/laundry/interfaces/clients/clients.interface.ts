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
  phone?: string;
  address?: string;
  acronym?: string;
  branch_office_id?: string;
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
