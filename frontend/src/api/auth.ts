import { api } from './client';
import type { AuthResponse } from '@/types';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  university: string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/Auth/login', payload).then((r) => r.data),
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/Auth/register', payload).then((r) => r.data),
  refresh: (refreshToken: string) =>
    api.post<AuthResponse>('/Auth/refresh', { refreshToken }).then((r) => r.data),
  revoke: (refreshToken: string) =>
    api.post('/Auth/revoke', { refreshToken })
};
