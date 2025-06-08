import { create } from 'zustand';
import { authService } from '../services/api';
import type {
  LoginRequest,
  RegistrationRequest,
  RegistrationVerificationRequest,
} from '../types/auth';

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegistrationRequest | RegistrationVerificationRequest) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),

  login: async (data: LoginRequest) => {
    const response = await authService.login(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    set({
      isAuthenticated: true,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
    });
  },

  register: async (data: RegistrationRequest | RegistrationVerificationRequest) => {
    try {
      if ('code' in data) {
        await authService.verifyRegistration(data);
      } else {
        await authService.register(data);
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
  },
}));
