import { authApi } from '../api/auth.api';

export const logoutAction = async (refreshToken: string): Promise<void> => {
  await authApi.logout(refreshToken);
};
