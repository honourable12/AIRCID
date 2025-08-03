import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User, LoginCredentials, ApiResponse } from '@/types';
import { env } from '@/config/env';

interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  refreshToken: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true });
        try {
          const response: ApiResponse<{ user: User; token: string }> = await fetch(
            `${env.API_BASE_URL}/auth/login`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(credentials),
            }
          ).then((res) => res.json());

          if (response.success) {
            const { user, token } = response.data;
            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            throw new Error(response.message || 'Login failed');
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        set(initialState);
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },

      clearAuth: () => {
        set(initialState);
      },

      refreshToken: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response: ApiResponse<{ token: string }> = await fetch(
            `${env.API_BASE_URL}/auth/refresh`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }
          ).then((res) => res.json());

          if (response.success) {
            set({ token: response.data.token });
          } else {
            get().logout();
          }
        } catch (error) {
          get().logout();
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
