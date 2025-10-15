export interface User {
  id: string;
  username: string;
  email: string;
  nombre: string;
  apellido: string;
  roles: string[];
  sucursalId: string;
  token?: string;
}
