import axios from 'axios';
import type {
  RegistrationRequest,
  RegistrationVerificationRequest,
  LoginRequest,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangeContactRequest,
  ChangeContactConfirmRequest,
  RefreshTokenRequest,
} from '../types/auth';

const API_URL = '/api/v1/core';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Request Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export const authService = {
  register: async (data: RegistrationRequest) => {
    const response = await api.post('/auth/registration_request/', data);
    return response.data;
  },

  verifyRegistration: async (data: RegistrationVerificationRequest) => {
    const response = await api.post('/auth/registration_confirm/', data);
    return response.data;
  },

  login: async (data: LoginRequest) => {
    const response = await api.post('/auth/login/', data);
    return response.data;
  },

  requestPasswordReset: async (data: PasswordResetRequest) => {
    const response = await api.post('/auth/password_reset_request/', data);
    return response.data;
  },

  confirmPasswordReset: async (data: PasswordResetConfirmRequest) => {
    const response = await api.post('/auth/password_reset_confirm/', data);
    return response.data;
  },

  requestContactChange: async (data: ChangeContactRequest) => {
    const response = await api.post('/auth/change_contact_request/', data);
    return response.data;
  },

  confirmContactChange: async (data: ChangeContactConfirmRequest) => {
    const response = await api.post('/auth/change_contact_confirm/', data);
    return response.data;
  },

  refreshToken: async (data: RefreshTokenRequest) => {
    const response = await api.post('/auth/refresh_token/', data);
    return response.data;
  },
};
