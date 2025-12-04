export interface Bundle {
  id: string;
  bundle_number: string;
  guide_id: string;
  branch_office_id: string;
  scanned_rfid_codes: string[];
  total_garments: number;
  total_weight?: number;
  created_by_user_id?: string;
  scan_location?: string;
  status?: string;
  status_label?: string;
  notes?: string;
  qr_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones expandidas
  guide_number?: string;
  client_name?: string;
  branch_office_name?: string;
  created_by_user_name?: string;
}

export interface CreateBundleDto {
  guide_id: string;
  branch_office_id?: string;
  scanned_rfid_codes: string[];
  scan_location?: string;
  notes?: string;
}

export interface UpdateBundleDto {
  scanned_rfid_codes?: string[];
  status?: string;
  scan_location?: string;
  notes?: string;
}

export interface ValidateBundleGarmentsDto {
  guide_id: string;
  rfid_codes: string[];
}

export interface ValidateBundleGarmentsResponse {
  valid: string[];
  invalid: string[];
  duplicated: string[];
}

export interface BundlesResponse {
  bundles: Bundle[];
  total: number;
  totalPages: number;
}

export interface BundlePrintLabel {
  bundle_id: string;
  bundle_number: string;
  guide_number: string;
  client_name: string;
  branch_office_name: string;
  created_by_user_name: string;
  total_garments: number;
  total_weight?: number;
  garment_summary: string;
  qr_code: string;
  created_at: string;
}

export interface BundleGarmentDetail {
  rfid_code: string;
  garment_type?: string;
  garment_type_label?: string;
  description?: string;
  weight?: number;
  color?: string[];
}

