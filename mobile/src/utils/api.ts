import { getToken } from './auth';

const BASE = 'https://travelm8app.vercel.app';

type ApiResponse<T> = { success: boolean; data?: T; error?: string };

async function headers(withAuth = true): Promise<Record<string, string>> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (withAuth) {
    const token = await getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

export async function apiPost<T>(path: string, body: any): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: await headers(),
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, { headers: await headers() });
  return res.json();
}

export async function apiDelete(path: string): Promise<ApiResponse<void>> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'DELETE',
    headers: await headers(),
  });
  return res.json();
}
