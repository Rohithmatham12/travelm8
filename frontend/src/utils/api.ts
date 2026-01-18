// API Utility Functions
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Get authentication token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('authToken');
}

/**
 * Set authentication token in localStorage
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('authToken', token);
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  localStorage.removeItem('authToken');
}

/**
 * Get user info from localStorage
 */
export function getUser(): any | null {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Set user info in localStorage
 */
export function setUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
}

/**
 * Remove user info from localStorage
 */
export function removeUser(): void {
  localStorage.removeItem('user');
}

/**
 * Make an API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return data as ApiResponse<T>;
  } catch (error) {
    console.error('API request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * GET request
 */
export async function get<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Parse API response (for backward compatibility)
 */
export const parseApiResponse = async (response: Response): Promise<ApiResponse> => {
  try {
    const data = await response.json();
    return data as ApiResponse;
  } catch (error) {
    console.error('Error parsing API response:', error);
    return { success: false, error: 'Failed to parse response' };
  }
};

export const handleApiError = (error: any) => {
  console.error('API Error:', error);
  return { success: false, error: 'An unexpected error occurred' };
};
