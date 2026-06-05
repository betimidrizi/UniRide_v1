import { api } from './client';

export interface ReviewCreatePayload {
  targetUserId: number;
  rideId: number;
  rating: number;
  comment?: string;
}

export interface Review {
  reviewId: number;
  reviewerId: number;
  reviewerName?: string | null;
  targetUserId: number;
  rideId: number;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export const reviewsApi = {
  create: (p: ReviewCreatePayload) => api.post<Review>('/Reviews', p).then((r) => r.data),
  forUser: (userId: number) => api.get<Review[]>(`/Reviews/user/${userId}`).then((r) => r.data),
  mine: () => api.get<Review[]>('/Reviews/mine').then((r) => r.data),
  exists: (rideId: number, targetUserId: number) =>
    api
      .get<{ exists: boolean }>('/Reviews/exists', { params: { rideId, targetUserId } })
      .then((r) => r.data.exists)
};
