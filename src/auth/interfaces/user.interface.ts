export interface User {
  id: string;
  username: string;
  email: string;
  nombre?: string;
  apellido?: string;
  roles: string[];
  sucursalId?: string;
  branch_office_id?: string;
  branch_office_name?: string;
  allowed_branches?: Array<{ id: string; name: string }>;
  token?: string;
}
