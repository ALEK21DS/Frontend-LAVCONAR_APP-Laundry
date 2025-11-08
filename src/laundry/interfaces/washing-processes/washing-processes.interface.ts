export interface WashingProcess {
  id: string;
  guide_id: string;
  branch_offices_id: string;
  machine_code?: string;
  process_type: string;
  process_type_label?: string;
  start_time: Date | string;
  load_weight?: number;
  garment_quantity?: number;
  special_treatment?: string;
  wash_temperature?: string;
  detergent_type?: string;
  softener_used?: boolean;
  bleach_used?: boolean;
  end_time?: Date | string;
  status?: string;
  status_label?: string;
  notes?: string;
  is_active?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
  // Propiedades adicionales del backend
  branch_office_name?: string;
  // Relaciones
  guide?: {
    id: string;
    guide_number: string;
    client: {
      id: string;
      name: string;
    };
  };
  machine?: {
    id: string;
    code: string;
    type: string;
    weight_capacity: number;
  };
  branch_offices?: {
    id: string;
    name: string;
  };
}

export interface WashingProcessResponse {
  status: number;
  message: string;
  data: WashingProcess[];
  totalData: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface WashingProcessDetailResponse {
  status: number;
  message: string;
  data: WashingProcess;
  timestamp: string;
}

export interface CreateWashingProcessDto {
  guide_id: string;
  branch_offices_id?: string;
  machine_code?: string;
  process_type?: string;
  start_time: string;
  load_weight?: number;
  garment_quantity?: number;
  special_treatment?: string;
  wash_temperature?: string;
  detergent_type?: string;
  softener_used?: boolean;
  bleach_used?: boolean;
  end_time?: string;
  status?: string;
  notes?: string;
}

export interface UpdateWashingProcessDto
  extends Partial<CreateWashingProcessDto> {}

export interface WashingProcessFilters {
  page?: number;
  limit?: number;
  search?: string;
  branch_office_id?: string;
  process_type?: string;
  process_status?: string;
}

