export interface CreateAuthorizationRequestDto {
  entity_type: string;
  entity_id: string;
  action_type: string;
  requested_data?: Record<string, any>;
  reason: string;
}

export interface AuthorizationRequest {
  id: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  requested_data?: Record<string, any>;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requested_by_id: string;
  approved_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CheckAuthorizationParams {
  entity_type: string;
  entity_id: string;
  action_type: string;
}

