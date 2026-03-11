/**
 * API Client para consumir los endpoints del backend PHP de AudFact.
 * Base URL configurable vía variable de entorno NEXT_PUBLIC_API_URL.
 */

const API_BASE_FALLBACK = 'http://localhost:8080';
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL || API_BASE_FALLBACK).replace(/\/+$/, '');

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
}

export interface PaginatedResponse<T = unknown> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: Record<string, string | number | null>;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({
      success: false,
      message: `Error HTTP ${res.status}`,
    }));
    throw new Error(errorData.message || `Error ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),

  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};
