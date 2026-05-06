import {
  post,
  setAuthToken,
  setUser,
  getUser,
  removeAuthToken,
  removeUser,
  enableDemoMode,
  disableDemoMode,
  isDemoMode,
  DEMO_TOKEN,
} from './api';

export { getUser, isDemoMode };

export interface User {
  userId: string;
  email: string;
  name?: string;
  role?: 'traveler' | 'admin';
}

export interface AuthResponse {
  user: User;
  token: string;
}

function demoAuth(email: string, name?: string): AuthResponse {
  const user = {
    userId: 'demo-user',
    email: email || 'demo@travelm8.app',
    name: name || 'TravelM8 Demo',
    role: 'traveler' as const,
  };
  const token = DEMO_TOKEN;
  setAuthToken(token);
  setUser(user);
  return { user, token };
}

export function startDemoSession(): AuthResponse {
  enableDemoMode();
  return demoAuth('demo@travelm8.app', 'TravelM8 Demo');
}

/**
 * Register a new user
 */
export async function register(email: string, password: string, name?: string): Promise<AuthResponse> {
  disableDemoMode();

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
  disableDemoMode();

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
  disableDemoMode();
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
