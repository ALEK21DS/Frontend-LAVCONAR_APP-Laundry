import { authApi } from '../api/auth.api';
import { LoginCredentials, LoginResponse } from '../interfaces/auth.response';

export const loginAction = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return await authApi.login(credentials);
};

export const loginDemoAction = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  return await authApi.loginDemo(credentials);
};
