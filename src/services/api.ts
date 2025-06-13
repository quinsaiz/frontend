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
import type {
  SearchParams,
  FilterOptions,
  Paper,
  ScrapingSession,
  PaginatedResponse,
  DataReadyResponse,
  SearchResponse,
} from '../types/search';

const API_URL = '/api/v1/core';
const SCRAPER_API_URL = '/api/v1/raw-scraper';
const SCHOLAR_API_URL = '/api/v1/scholar-raw-record';
const SESSION_API_URL = '/api/v1/scraping-session';

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message || error.message;
    throw new ApiError(message);
  }
  throw new ApiError('An unknown error occurred');
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const scraperApi = axios.create({
  baseURL: SCRAPER_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const scholarApi = axios.create({
  baseURL: SCHOLAR_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const sessionApi = axios.create({
  baseURL: SESSION_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

[api, scraperApi, scholarApi, sessionApi].forEach((axiosInstance) => {
  axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => handleError(error)
  );
});

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

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change_password/', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },
};

export const searchService = {
  async getFilterOptions(): Promise<FilterOptions> {
    try {
      const response = await scraperApi.get('/filter-options/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getSessions(): Promise<ScrapingSession[]> {
    try {
      const response = await sessionApi.get<ScrapingSession[]>('/');
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async startSearch(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await scraperApi.post('/scrape/', params);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async checkDataReady(
    taskId: string,
    sessionId: number,
    lastCheck?: string
  ): Promise<DataReadyResponse> {
    try {
      const params = new URLSearchParams({
        task_id: taskId,
        session_id: sessionId.toString(),
      });
      if (lastCheck) {
        params.append('last_check', lastCheck);
      }
      const response = await scholarApi.get('/data-ready/', {
        params: params,
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getResults(sessionId: number, page: number = 1): Promise<PaginatedResponse<Paper>> {
    try {
      const response = await scholarApi.get<PaginatedResponse<Paper>>(
        `/?session_id=${sessionId}&page=${page}`
      );
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async exportResults(sessionId: number, format: 'csv' | 'excel' | 'authors-csv'): Promise<Blob> {
    try {
      const response = await scholarApi.get(`/results/export-${format}/`, {
        params: { session_id: sessionId },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },

  async getSessionDetails(sessionId: number): Promise<ScrapingSession> {
    try {
      const response = await sessionApi.get(`/${sessionId}/`);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  },
};
