import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import type { AuthResponse, ProblemDetails } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// ── Request interceptor: attach Bearer token ───────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

// ── Response interceptor: silent refresh on 401 ────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<AuthResponse>(`${API_BASE}/Auth/refresh`, { refreshToken });
    useAuthStore.getState().setSession(data);
    return data.accessToken;
  } catch {
    useAuthStore.getState().clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ProblemDetails>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Try silent refresh on 401, once per request.
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/Auth/login') &&
      !original.url?.includes('/Auth/register') &&
      !original.url?.includes('/Auth/refresh')
    ) {
      original._retry = true;
      refreshPromise ??= performRefresh().finally(() => {
        refreshPromise = null;
      });
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return api(original);
      }
      // Refresh failed → bounce to login.
      window.location.assign('/login');
      return Promise.reject(error);
    }

    // Surface ProblemDetails errors as toasts (skip auth endpoints — pages handle their own).
    const url = original?.url ?? '';
    const isAuthEndpoint = url.includes('/Auth/');
    if (!isAuthEndpoint) {
      const problem = error.response?.data;
      const message =
        problem?.detail ||
        problem?.title ||
        error.message ||
        'Something went wrong.';
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const problem = err.response?.data as ProblemDetails | undefined;
    if (problem?.errors) {
      const first = Object.values(problem.errors).flat()[0];
      if (first) return first;
    }
    return problem?.detail || problem?.title || err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong.';
}
