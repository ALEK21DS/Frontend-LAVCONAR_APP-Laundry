import { User } from './user.interface';

export interface LoginCredentials {
  username: string;
  password: string;
  sucursalId: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}
