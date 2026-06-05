import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse, DecodedUser, Role } from '@/types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
  user: DecodedUser | null;
  setSession: (res: AuthResponse) => void;
  setAccessToken: (token: string, expiresAt: string) => void;
  clear: () => void;
}

function decode(token: string): DecodedUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const idRaw =
      payload.sub ??
      payload.nameid ??
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
    return {
      id: Number(idRaw),
      email:
        payload.email ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
        '',
      name:
        payload.unique_name ??
        payload.name ??
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        '',
      role: (payload.role ??
        payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        'Student') as Role
    };
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,
      setSession: (res) =>
        set({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.accessTokenExpiresAt,
          user: {
            id: res.userId,
            email: res.email,
            name: res.fullName,
            role: res.role
          }
        }),
      setAccessToken: (token, expiresAt) =>
        set((state) => ({
          accessToken: token,
          expiresAt,
          user: state.user ?? decode(token)
        })),
      clear: () =>
        set({ accessToken: null, refreshToken: null, expiresAt: null, user: null })
    }),
    {
      name: 'uniride-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        expiresAt: s.expiresAt,
        user: s.user
      })
    }
  )
);

export function isAuthenticated(): boolean {
  return Boolean(useAuthStore.getState().accessToken);
}
