import { api } from './client';
import type { Reservation } from '@/types';

export const reservationsApi = {
  mine: () => api.get<Reservation[]>('/Reservations/mine').then((r) => r.data),
  join: (rideId: number) =>
    api.post<Reservation>('/Reservations', { rideId }).then((r) => r.data),
  cancel: (id: number) => api.delete(`/Reservations/${id}`),
  approve: (id: number) => api.patch<Reservation>(`/Reservations/${id}/approve`).then((r) => r.data),
  reject: (id: number) => api.patch<Reservation>(`/Reservations/${id}/reject`).then((r) => r.data)
};
