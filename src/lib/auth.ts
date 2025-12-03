import axios from 'axios';
import { AUTH_STORAGE_KEY, API_BASE_URL, API_VERSION } from './constants';
import { authApi } from './api';

export function getApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function setApiKey(apiKey: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, apiKey);
}

export function removeApiKey(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getApiKey() !== null;
}

// Step 1: Login with username/password - sends OTP via WhatsApp
export interface LoginResponse {
  success: boolean;
  data?: {
    message: string;
    phoneLastDigits: string;
    expiresIn: number;
  };
  error?: string;
  message?: string;
}

export async function loginWithCredentials(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/login`, {
      username,
      password,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      error: 'CONNECTION_ERROR',
      message: 'Error al conectar con el servidor',
    };
  }
}

// Step 2: Verify OTP and get API key
export interface VerifyOTPResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
      lastLogin: string;
    };
    apiKey: string;
    message: string;
  };
  error?: string;
  message?: string;
}

export async function verifyOTP(username: string, otp: string): Promise<VerifyOTPResponse> {
  try {
    const response = await axios.post(`${API_BASE_URL}${API_VERSION}/auth/verify-otp`, {
      username,
      otp,
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    return {
      success: false,
      error: 'CONNECTION_ERROR',
      message: 'Error al conectar con el servidor',
    };
  }
}

// Legacy direct API key login (still works for testing)
export async function login(apiKey: string): Promise<boolean> {
  // Test the API key
  const isValid = await authApi.testConnection(apiKey);

  if (isValid) {
    setApiKey(apiKey);
    return true;
  }

  return false;
}

export function logout(): void {
  removeApiKey();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
