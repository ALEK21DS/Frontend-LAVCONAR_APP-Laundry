// Enums para RfidScan que coinciden con el backend
export const ScanTypeEnum = {
  COLLECTION: "COLLECTION",
  WAREHOUSE_RECEPTION: "WAREHOUSE_RECEPTION",
  PRE_WASH: "PRE_WASH",
  POST_WASH: "POST_WASH",
  POST_DRY: "POST_DRY",
  FINAL_COUNT: "FINAL_COUNT",
  DELIVERY: "DELIVERY",
} as const;

export type ScanTypeEnum = typeof ScanTypeEnum[keyof typeof ScanTypeEnum];

export interface RfidScan {
  id: string;
  guide_id: string;
  branch_offices_id: string;
  scan_type: ScanTypeEnum;
  scanned_quantity: number;
  scanned_rfid_codes: string[];
  user_id: string;
  location?: string;
  unexpected_codes?: string[];
  differences_detected?: string;
  is_active: boolean;
  created_at: Date | string;
  // Propiedades expandidas por el backend
  branch_office_name?: string;
  guide_number?: string;
  user_email?: string;
  user_username?: string;
}

export interface CreateRfidScanDto {
  guide_id: string;
  branch_offices_id?: string;
  scan_type: ScanTypeEnum;
  scanned_quantity: number;
  scanned_rfid_codes: string[];
  unexpected_codes?: string[];
  // user_id: NO se envía, el backend lo obtiene del token JWT
  location?: string;
  differences_detected?: string;
}

export interface UpdateRfidScanDto extends Partial<CreateRfidScanDto> {}

export interface RfidScanFilters {
  guide_id?: string[];
  rfid_code?: string[];
  scan_type?: string;
  page?: number;
  limit?: number;
  search?: string;
}

