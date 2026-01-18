import { post, setAuthToken, setUser, removeAuthToken, removeUser } from './api';

export interface User {
  userId: string;
  email: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Register a new user
 */
export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  const response = await post<{ user: User; token: string }>('/auth/register', {
    email,
    password,
    name,
  });

  if (response.success && response.data) {
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  throw new Error(response.error || 'Registration failed');
}

/**
 * Login user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await post<{ user: User; token: string }>('/auth/login', {
    email,
    password,
  });

  if (response.success && response.data) {
    setAuthToken(response.data.token);
    setUser(response.data.user);
    return response.data;
  }

  throw new Error(response.error || 'Login failed');
}

/**
 * Logout user
 */
export function logout(): void {
  removeAuthToken();
  removeUser();
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

