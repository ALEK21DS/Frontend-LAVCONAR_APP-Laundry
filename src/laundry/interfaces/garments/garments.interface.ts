export interface Garment {
  id: string;
  rfid_code: string;
  branch_offices_id?: string;
  description?: string;
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string;
  physical_condition?: string;
  weight?: number; // Peso de la prenda en kg
  observations?: string;
  qr_code?: string;
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
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string;
  physical_condition?: string;
  weight?: number;
  observations?: string;
  qr_code?: string;
}

export interface UpdateGarmentDto {
  description?: string;
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string;
  physical_condition?: string;
  observations?: string;
  weight?: number;
  qr_code?: string;
}

