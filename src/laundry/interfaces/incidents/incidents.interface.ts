export type IncidentType = 'DELAY' | 'QUALITY_ISSUE' | 'DAMAGE' | 'LOSS' | 'OTHER';
export type IncidentStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type ActionTaken = 'REPAIR' | 'REPLACE' | 'COMPENSATE' | 'REFUND' | 'OTHER';

export interface Incident {
  id: string;
  guide_id: string;
  guide?: {
    id: string;
    guide_number: string;
    client_name?: string;
  };
  guide_number?: string; // Campo directo que puede venir del backend
  branch_offices_id: string;
  branch_offices?: {
    id: string;
    name: string;
  };
  branch_office_name?: string; // Campo directo del backend
  user_id: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  user_name?: string; // Campo directo del backend
  user_email?: string; // Campo directo del backend
  rfid_code?: string;
  garment?: {
    rfid_code: string;
    description?: string;
  };
  incident_type: IncidentType;
  description: string;
  responsible?: string;
  action_taken?: ActionTaken;
  compensation_amount?: number;
  status: IncidentStatus;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateIncidentDto {
  guide_id: string;
  branch_offices_id?: string; // Se asigna automáticamente desde el usuario autenticado
  rfid_code?: string;
  incident_type: IncidentType;
  description: string;
  responsible?: string;
  action_taken?: ActionTaken;
  compensation_amount?: number;
  status?: IncidentStatus; // Por defecto OPEN
}

export interface UpdateIncidentDto {
  guide_id?: string;
  rfid_code?: string;
  incident_type?: IncidentType;
  description?: string;
  responsible?: string;
  action_taken?: ActionTaken;
  compensation_amount?: number;
  status?: IncidentStatus;
}

