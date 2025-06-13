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
  user: {
    id: number;
    firstName: string;
    lastName: string;
  } | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegistrationRequest | RegistrationVerificationRequest) => Promise<void>;
  logout: () => void;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!localStorage.getItem('access_token'),
  accessToken: localStorage.getItem('access_token'),
  refreshToken: localStorage.getItem('refresh_token'),
  user: JSON.parse(
    localStorage.getItem('user') === 'undefined' ? 'null' : localStorage.getItem('user') || 'null'
  ),

  login: async (data: LoginRequest) => {
    const response = await authService.login(data);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    set({
      isAuthenticated: true,
      accessToken: response.access_token,
      refreshToken: response.refresh_token,
      user: response.user,
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
    localStorage.removeItem('user');
    set({
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      user: null,
    });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  },
}));
