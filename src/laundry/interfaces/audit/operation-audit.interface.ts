export interface OperationAudit {
  id: string;
  user_id: string;
  user_email?: string;
  username?: string;
  audit_action: string;
  ip_address: string | null;
  user_agent: string | null;
  entity: string;
  entity_id: string;
  previous_data: any | null;
  new_data: any | null;
  changes: any | null;
  description: string | null;
  branch_offices_id: string | null;
  branch_office_name?: string;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface OperationAuditFilters {
  search?: string;
  user_id?: string;
  audit_action?: string;
  entity?: string;
  entity_id?: string;
  branch_office_id?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

