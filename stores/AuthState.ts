import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KilterApiClient } from '../lib/kilterApiClient';

const kilterApiClient = new KilterApiClient();

interface User {
  id: number;
  username: string;
  email_address: string;
  city: string | null;
  country: string | null;
  avatar_image: string | null;
  banner_image: string | null;
  height: number | null;
  wingspan: number | null;
  weight: number | null;
  is_public: boolean;
  is_listed: boolean;
  created_at: string;
  updated_at: string;
}

interface SessionResponse {
  session: {
    token: string;
    user_id: number;
  };
}

interface AuthError {
  message: string;
  errors?: {
    [key: string]: Array<{
      message: string;
    }>;
  };
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;

  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => void;
  clearError: () => void;
  fetchUserData: (userId: number, token: string) => Promise<User | null>;
}

export const useAuthState = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      error: null,

      signIn: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        const requestBody = {
          username,
          password,
          tou: 'accepted',
          pp: 'accepted',
          ua: 'app',
        };

        try {
          const response = await kilterApiClient.post<SessionResponse>(
            '/sessions',
            requestBody,
          );

          if (!response.ok) {
            const authError = response.data as unknown as AuthError;
            let errorMessage = authError.message || 'Sign in failed';

            // Extract specific field errors if available
            if (authError.errors) {
              const fieldErrors = Object.values(authError.errors)
                .flat()
                .map(err => err.message)
                .join(', ');
              if (fieldErrors) {
                errorMessage = fieldErrors;
              }
            }

            set({ error: errorMessage, isLoading: false });
            return;
          }

          const session = response.data.session;

          // Fetch full user data
          const userData = await get().fetchUserData(
            session.user_id,
            session.token,
          );

          const user: User = userData || {
            id: session.user_id,
            username: '', // Fallback if user data fetch fails
            email_address: '',
            city: null,
            country: null,
            avatar_image: null,
            banner_image: null,
            height: null,
            wingspan: null,
            weight: null,
            is_public: true,
            is_listed: true,
            created_at: '',
            updated_at: '',
          };

          set({
            token: session.token,
            user: user,
            isLoading: false,
            error: null,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : 'Network error',
            isLoading: false,
          });
        }
      },

      signOut: () => {
        set({
          token: null,
          user: null,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },

      fetchUserData: async (
        userId: number,
        token: string,
      ): Promise<User | null> => {
        try {
          const response = await kilterApiClient.get<{ users: User[] }>(
            `/users/${userId}`,
            { token },
          );

          if (!response.ok) {
            return null;
          }

          // API returns { users: [user] } format
          if (response.data.users && response.data.users.length > 0) {
            return response.data.users[0];
          }
          return null;
        } catch (err) {
          return null;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: state => ({
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
