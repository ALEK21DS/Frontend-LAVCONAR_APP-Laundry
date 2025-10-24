// Enums para GuideGarment que coinciden con el backend
export const GarmentTypeEnum = {
  UNIFORMS: "UNIFORMS",
  SHEETS: "SHEETS",
  TOWELS: "TOWELS",
  TABLECLOTHS: "TABLECLOTHS",
  CURTAINS: "CURTAINS",
  MATS: "MATS",
  OTHER: "OTHER",
} as const;

export const PredominantColorEnum = {
  WHITE: "WHITE",
  LIGHT_COLORS: "LIGHT_COLORS",
  DARK_COLORS: "DARK_COLORS",
  MIXED: "MIXED",
} as const;

export type GarmentTypeEnum = typeof GarmentTypeEnum[keyof typeof GarmentTypeEnum];
export type PredominantColorEnum = typeof PredominantColorEnum[keyof typeof PredominantColorEnum];

export interface GuideGarment {
  id: string;
  guide_id: string;
  branch_offices_id: string;
  garment_type?: GarmentTypeEnum;
  predominant_color?: PredominantColorEnum;
  requested_services?: string[];
  initial_state_desc?: string;
  additional_cost?: number;
  observations?: string;
  is_active: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  // Nuevos campos - peso y cantidad
  garment_weight?: number;
  quantity?: number;
  // Nuevos campos - observaciones y estado
  novelties?: string[];
  label_printed?: boolean;
  label_printed_at?: Date | string;
  // Propiedades expandidas por el backend
  branch_office_name?: string;
  guide_number?: string;
}

export interface CreateGuideGarmentDto {
  guide_id: string;
  branch_offices_id?: string;
  garment_type?: GarmentTypeEnum;
  predominant_color?: PredominantColorEnum;
  requested_services?: string[];
  initial_state_desc?: string;
  additional_cost?: number;
  observations?: string;
  garment_weight?: number;
  quantity?: number;
  novelties?: string[];
  label_printed?: boolean;
  label_printed_at?: Date | string;
}

export interface UpdateGuideGarmentDto extends Partial<CreateGuideGarmentDto> {}

export interface GuideGarmentFilters {
  guide_id?: string[];
  rfid_code?: string[];
  page?: number;
  limit?: number;
  search?: string;
}

