import { useAuthStore } from '../store/auth.store';

export const useAuth = () => {
  const { login, loginDemo, logout, user, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginDemo,
    logout,
    clearError,
  };
};
