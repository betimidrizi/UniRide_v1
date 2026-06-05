import * as signalR from '@microsoft/signalr';
import { useAuthStore } from '@/store/authStore';
import type { ChatMessage } from '@/types';

const HUB_BASE = import.meta.env.VITE_SIGNALR_URL || '/hubs/chat';

let connection: signalR.HubConnection | null = null;
let connectionToken: string | null = null;

export function getChatConnection() {
  const token = useAuthStore.getState().accessToken;

  if (connection && connectionToken !== token) {
    const staleConnection = connection;
    connection = null;
    connectionToken = null;
    if (staleConnection.state !== signalR.HubConnectionState.Disconnected) {
      staleConnection.stop().catch(() => undefined);
    }
  }

  if (connection) return connection;

  connectionToken = token;
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_BASE, {
      accessTokenFactory: () => useAuthStore.getState().accessToken ?? ''
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}

export async function resetChatConnection() {
  const staleConnection = connection;
  connection = null;
  connectionToken = null;
  if (staleConnection && staleConnection.state !== signalR.HubConnectionState.Disconnected) {
    await staleConnection.stop();
  }
}

export async function ensureChatConnection() {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  }
  return conn;
}

export async function joinConversation(rideId: number, otherUserId: number) {
  const conn = await ensureChatConnection();
  await conn.invoke('JoinConversation', rideId, otherUserId);
}

export async function leaveConversation(rideId: number, otherUserId: number) {
  const conn = getChatConnection();
  if (conn.state === signalR.HubConnectionState.Connected) {
    await conn.invoke('LeaveConversation', rideId, otherUserId);
  }
}

export function onMessage(handler: (message: ChatMessage) => void) {
  const conn = getChatConnection();
  conn.on('ReceiveMessage', handler);
  return () => conn.off('ReceiveMessage', handler);
}

export function onUnreadCountChanged(handler: (count: number) => void) {
  const conn = getChatConnection();
  conn.on('UnreadCountChanged', handler);
  return () => conn.off('UnreadCountChanged', handler);
}
