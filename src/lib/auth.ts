import { AUTH_STORAGE_KEY } from './constants';
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
