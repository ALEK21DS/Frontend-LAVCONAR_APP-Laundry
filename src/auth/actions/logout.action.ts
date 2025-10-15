import { authApi } from '../api/auth.api';

export const logoutAction = async (): Promise<void> => {
  await authApi.logout();
};
