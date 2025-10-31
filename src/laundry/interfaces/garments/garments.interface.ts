export interface Garment {
  id: string;
  rfid_code: string;
  branch_offices_id?: string;
  description?: string;
  color?: string;
  garment_type?: string;
  brand?: string;
  physical_state?: string;
  weight?: number; // Peso de la prenda en kg
  observations?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Propiedades expandidas por el backend
  branch_office_name?: string;
}

export interface CreateGarmentDto {
  rfid_code?: string;
  branch_offices_id?: string;
  description?: string;
  color?: string;
  garment_type?: string;
  brand?: string;
  physical_state?: string;
  weight?: number;
  observations?: string;
}

export interface UpdateGarmentDto {
  description?: string;
  color?: string;
  garment_type?: string;
  brand?: string;
  physical_state?: string;
  observations?: string;
  weight?: number;
  status?: string;
}

