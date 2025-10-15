import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../store/auth.store';
import { LoginCredentials } from '../interfaces/auth.response';

export const useAuth = () => {
  const { login, loginDemo, logout, user, isAuthenticated, isLoading, error, clearError } =
    useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => login(credentials),
    onError: err => {
      console.error('Error en login:', err);
    },
  });

  const loginDemoMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => loginDemo(credentials),
    onError: err => {
      console.error('Error en login demo:', err);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onError: err => {
      console.error('Error en logout:', err);
    },
  });

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || logoutMutation.isPending,
    error: error || loginMutation.error?.message,
    login: loginMutation.mutateAsync,
    loginDemo: loginDemoMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    clearError,
  };
};
