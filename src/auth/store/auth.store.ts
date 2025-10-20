import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../interfaces/user.interface';
import { LoginCredentials } from '../interfaces/auth.response';
import { loginAction, loginDemoAction } from '../actions/login.action';
import { logoutAction } from '../actions/logout.action';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginDemo: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, _get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginAction(credentials);

          // Guardar tokens en AsyncStorage
          await AsyncStorage.setItem('auth-token', response.accessToken);
          await AsyncStorage.setItem('auth-refresh-token', response.refreshToken);

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      loginDemo: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await loginDemoAction(credentials);

          // Guardar tokens en AsyncStorage
          await AsyncStorage.setItem('auth-token', response.accessToken);
          await AsyncStorage.setItem('auth-refresh-token', response.refreshToken);

          set({
            user: response.user,
            token: response.accessToken,
            refreshToken: response.refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const errorMessage = 'Error al iniciar sesión';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      logout: async () => {
        const { refreshToken } = _get();
        try {
          if (refreshToken) {
            await logoutAction(refreshToken);
          }
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        } finally {
          await AsyncStorage.multiRemove(['auth-token', 'auth-refresh-token', 'auth-storage']);

          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      setUser: (user: User | null) => {
        set({ user, isAuthenticated: !!user });
      },

      setToken: (token: string | null) => {
        set({ token });
        if (token) {
          AsyncStorage.setItem('auth-token', token);
        } else {
          AsyncStorage.removeItem('auth-token');
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
