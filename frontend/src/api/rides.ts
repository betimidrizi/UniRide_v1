import { api } from './client';
import type { PagedResult, Reservation, Ride, RideCreatePayload, RideSearchParams } from '@/types';

export const ridesApi = {
  search: (params: RideSearchParams) =>
    api
      .get<PagedResult<Ride>>('/Rides', {
        params: {
          University: params.university,
          Location: params.location,
          DepartureFrom: params.departureFrom,
          DepartureTo: params.departureTo,
          MinSeats: params.minSeats,
          SortBy: params.sortBy,
          IncludeArchived: params.includeArchived,
          Page: params.page ?? 1,
          PageSize: params.pageSize ?? 12
        }
      })
      .then((r) => r.data),
  mine: () => api.get<Ride[]>('/Rides/mine').then((r) => r.data),
  byId: (id: number) => api.get<Ride>(`/Rides/${id}`).then((r) => r.data),
  passengers: (rideId: number) =>
    api.get<Reservation[]>(`/Rides/${rideId}/passengers`).then((r) => r.data),
  create: (payload: RideCreatePayload) =>
    api.post<Ride>('/Rides', payload).then((r) => r.data),
  update: (id: number, payload: RideCreatePayload) =>
    api.put<Ride>(`/Rides/${id}`, payload).then((r) => r.data),
  remove: (id: number) => api.delete(`/Rides/${id}`),
  start: (id: number) => api.patch<Ride>(`/Rides/${id}/start`).then((r) => r.data),
  complete: (id: number) => api.patch<Ride>(`/Rides/${id}/complete`).then((r) => r.data)
};
