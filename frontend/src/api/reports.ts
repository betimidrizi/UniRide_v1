import { api } from './client';
import type { Report, ReportStatus } from '@/types';

export interface ReportCreatePayload {
  targetUserId?: number;
  rideId?: number;
  reason: string;
  details: string;
}

export const reportsApi = {
  create: (payload: ReportCreatePayload) =>
    api.post<Report>('/Reports', payload).then((r) => r.data),
  all: () => api.get<Report[]>('/Reports').then((r) => r.data),
  setStatus: (id: number, status: ReportStatus) =>
    api.patch<Report>(`/Reports/${id}/status`, { status }).then((r) => r.data)
};
