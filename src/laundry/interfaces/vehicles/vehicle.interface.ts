export interface Vehicle {
  id: string;
  branch_office_id: string;
  branch_office_name?: string;
  unit_number?: string;
  plate_number: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  capacity: number; // en kg
  fuel_type: string;
  status: string;
  qr_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  vehicle_type?: string;
  branch_office_id?: string;
}

