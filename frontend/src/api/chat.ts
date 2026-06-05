import { api } from './client';
import type { ChatMessage, ChatThread } from '@/types';

export const chatApi = {
  threads: () => api.get<ChatThread[]>('/Chat/threads').then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/Chat/unread-count').then((r) => r.data.count),
  conversation: (rideId: number, otherUserId: number) =>
    api
      .get<ChatMessage[]>('/Chat/conversation', { params: { rideId, otherUserId } })
      .then((r) => r.data),
  send: (rideId: number, receiverId: number, message: string) =>
    api
      .post<ChatMessage>('/Chat', { rideId, receiverId, message })
      .then((r) => r.data)
};
