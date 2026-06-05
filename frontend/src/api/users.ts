import { api } from './client';
import type { UserProfile } from '@/types';

export const usersApi = {
  me: () => api.get<UserProfile>('/Users/me').then((r) => r.data),
  updateMe: (payload: { fullName: string; university: string; phoneNumber?: string }) =>
    api.put<UserProfile>('/Users/me', payload).then((r) => r.data),
  requestVerification: () =>
    api.patch<UserProfile>('/Users/me/request-verification').then((r) => r.data)
};
