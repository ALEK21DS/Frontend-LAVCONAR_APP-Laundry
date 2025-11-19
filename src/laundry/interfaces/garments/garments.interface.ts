export interface Garment {
  id: string;
  rfid_code: string;
  branch_offices_id?: string;
  service_type?: string;
  description?: string;
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string[]; // Array de códigos del catálogo garment_condition
  physical_condition?: string[]; // Array de códigos del catálogo physical_condition
  weight?: number; // Peso de la prenda en libras (lb)
  manufacturing_date?: string; // Fecha de fabricación (solo para servicio industrial)
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
  service_type?: string;
  description?: string;
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string[]; // Array de códigos del catálogo garment_condition
  physical_condition?: string[]; // Array de códigos del catálogo physical_condition
  weight?: number;
  manufacturing_date?: string;
  observations?: string;
  qr_code?: string;
}

export interface UpdateGarmentDto {
  description?: string;
  color?: string[]; // Array de códigos de colores del catálogo
  garment_type?: string;
  garment_brand?: string; // Nota: en el backend es garment_brand, no brand
  garment_condition?: string[]; // Array de códigos del catálogo garment_condition
  physical_condition?: string[]; // Array de códigos del catálogo physical_condition
  observations?: string;
  weight?: number;
  service_type?: string;
  manufacturing_date?: string;
  qr_code?: string;
}

