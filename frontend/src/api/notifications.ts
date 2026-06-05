import { api } from './client';

export interface Notification {
  notificationId: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  mine: (limit = 50) =>
    api.get<Notification[]>('/Notifications', { params: { limit } }).then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/Notifications/unread-count').then((r) => r.data.count),
  markRead: (id: number) => api.patch(`/Notifications/${id}/read`),
  markAllRead: () => api.patch('/Notifications/read-all'),
  delete: (id: number) => api.delete(`/Notifications/${id}`),
  deleteRead: () => api.delete<{ deleted: number }>('/Notifications/read').then((r) => r.data.deleted),
  deleteAll: () => api.delete<{ deleted: number }>('/Notifications').then((r) => r.data.deleted)
};
