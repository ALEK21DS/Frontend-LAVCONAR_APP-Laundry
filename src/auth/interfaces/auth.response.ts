import { User } from './user.interface';

export interface LoginCredentials {
  username: string;
  password: string;
  sucursalId?: string; // Para superadmin puede omitirse
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
}
