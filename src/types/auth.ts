export interface RegistrationRequest {
  phone: string;
  password: string;
  confirm_password: string;
  first_name: string;
  last_name: string;
}

export interface RegistrationVerificationRequest {
  phone: string;
  code: string;
}

export interface RegistrationResponse {
  message: string;
  email: string | null;
  phone: string;
}

export interface RegistrationConfirmRequest {
  phone: string;
  code: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: string;
}

export interface PasswordResetRequest {
  phone: string;
}

export interface PasswordResetConfirmRequest {
  phone: string;
  code: string;
  new_password: string;
}

export interface ChangeContactRequest {
  phone: string;
}

export interface ChangeContactConfirmRequest {
  phone: string;
  code: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

export interface ResetPasswordRequest {
  phone: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}
