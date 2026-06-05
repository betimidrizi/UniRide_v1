import { api } from './client';
import type { AdminStats, AdminUser } from '@/types';

export interface AdminUpdatePayload {
  fullName: string;
  email: string;
  university: string;
  phoneNumber?: string;
  role: string;
  isSuspended: boolean;
}

export const adminApi = {
  users: () => api.get<AdminUser[]>('/Admin/users').then((r) => r.data),
  suspend: (id: number) =>
    api.patch<AdminUser>(`/Admin/users/${id}/suspend`).then((r) => r.data),
  restore: (id: number) =>
    api.patch<AdminUser>(`/Admin/users/${id}/restore`).then((r) => r.data),
  verify: (id: number) =>
    api.patch<AdminUser>(`/Admin/users/${id}/verify`).then((r) => r.data),
  unverify: (id: number) =>
    api.patch<AdminUser>(`/Admin/users/${id}/unverify`).then((r) => r.data),
  updateUser: (id: number, payload: AdminUpdatePayload) =>
    api.put<AdminUser>(`/Admin/users/${id}`, payload).then((r) => r.data),
  deleteUser: (id: number) => api.delete(`/Admin/users/${id}`),
  forceDeleteRide: (id: number) => api.delete(`/Admin/rides/${id}`),
  stats: () => api.get<AdminStats>('/Admin/statistics').then((r) => r.data)
};
