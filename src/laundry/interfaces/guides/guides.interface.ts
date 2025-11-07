export interface GuideItem {
  id?: string;
  tagEPC: string;
  proceso: string;
  descripcion?: string;
}

export interface Guide {
  id: string;
  guide_number: string;
  client_id: string;
  client_name?: string;
  branch_office_id: string;
  branch_office_name?: string;
  general_condition?: 'GOOD' | 'REGULAR' | 'BAD';
  general_condition_label?: string;
  service_type?: 'INDUSTRIAL' | 'DOMESTIC' | 'HOSPITAL' | 'HOTEL';
  charge_type?: 'BY_WEIGHT' | 'BY_UNIT' | 'MIXED';
  total_weight?: number;
  total_garments?: number;
  collection_date: string;
  delivery_date?: string;
  status: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED';
  status_label?: string;
  notes?: string;
  requested_services_labels?: Record<string, string>;
  service_priority_label?: string;
  washing_type_label?: string;
  items: GuideItem[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateGuideDto {
  client_id: string;
  branch_office_id?: string;
  collection_date: string;
  general_condition?: 'GOOD' | 'REGULAR' | 'BAD';
  service_type?: 'INDUSTRIAL' | 'DOMESTIC' | 'HOSPITAL' | 'HOTEL';
  charge_type?: 'BY_WEIGHT' | 'BY_UNIT' | 'MIXED';
  total_weight?: number;
  total_garments?: number;
  delivery_date?: string;
  notes?: string;
}

export interface UpdateGuideStatusDto {
  guide_status?: 'COLLECTED' | 'IN_TRANSIT' | 'RECEIVED' | 'IN_PROCESS' | 'COMPLETED' | 'DELIVERED';
  notes?: string;
}

export interface GuidesResponse {
  guides: Guide[];
  total: number;
}
