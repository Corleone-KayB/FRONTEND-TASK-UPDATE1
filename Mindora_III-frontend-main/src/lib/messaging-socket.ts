import { io, type Socket } from "socket.io-client";
import type { Message } from "@/types/domain";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "https://api.mindora.rw";

// Goes through the Kong gateway - same host as NEXT_PUBLIC_API_URL by default, proxied
// via the `messaging-socket` route (infrastructure/kong/kong.railway.yml), since the
// production backend bundle has no public domain of its own for messaging-service to
// be reached directly on. Live-verified end to end. The handshake requires a JWT
// (auth.token); the server derives identity from it, so client->server payloads no
// longer carry userId/senderId.

interface ServerToClientEvents {
  conversation_created: (payload: { _id: string; participants: string[] }) => void;
  joined_conversation: (payload: { conversationId: string }) => void;
  message_history: (payload: { conversationId: string; messages: Message[] }) => void;
  new_message: (payload: Message) => void;
  // Batched - messageIds is an array, update every id in one pass rather than per-message.
  messages_delivered: (payload: {
    conversationId: string;
    messageIds: string[];
    deliveredAt: string;
    deliveredTo: string;
  }) => void;
  message_read: (payload: {
    conversationId: string;
    messageId: string;
    readAt: string;
    readBy: string;
  }) => void;
  // Batched read receipt from mark_conversation_read - broadcast to the whole
  // conversation, so both the sender (blue ticks) and the reader (unread badge)
  // react to the same event.
  conversation_read: (payload: {
    conversationId: string;
    messageIds: string[];
    readAt: string;
    readBy: string;
  }) => void;
  user_typing: (payload: { conversationId: string; userId: string }) => void;
  user_stopped_typing: (payload: { conversationId: string; userId: string }) => void;
  presence_changed: (payload: { userId: string; online: boolean; lastSeen: string | null }) => void;
  error: (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  register_presence: () => void;
  heartbeat: () => void;
  logout_presence: () => void;
  create_conversation: (payload: { participants: [string, string] }) => void;
  join_conversation: (payload: { conversationId: string }) => void;
  send_message: (payload: { conversationId: string; content: string }) => void;
  mark_read: (payload: { conversationId: string; messageId: string }) => void;
  mark_conversation_read: (payload: { conversationId: string }) => void;
  typing_start: (payload: { conversationId: string }) => void;
  typing_stop: (payload: { conversationId: string }) => void;
}

type MessagingSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: MessagingSocket | null = null;

// Connects (or reconnects the existing singleton) with the given access token.
export function connectMessagingSocket(accessToken: string): MessagingSocket {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false, auth: { token: accessToken } });
  } else {
    socket.auth = { token: accessToken };
  }
  socket.connect();
  return socket;
}

// Access tokens expire every 15 minutes. Call this whenever the app obtains a new
// one (see the onAccessTokenChange subscription in useMessaging.ts) - updating
// .auth alone isn't enough because socket.io only reads it at handshake time, so a
// live connection has to be dropped and re-established to actually pick up the
// new token, rather than just waiting for the next automatic reconnect attempt
// (which would otherwise keep replaying the stale one).
export function reconnectMessagingSocket(accessToken: string): void {
  if (!socket) return;
  socket.auth = { token: accessToken };
  socket.disconnect().connect();
}

export function disconnectMessagingSocket(): void {
  socket?.disconnect();
}

export function registerPresence(): void {
  socket?.emit("register_presence");
}

export function sendHeartbeat(): void {
  socket?.emit("heartbeat");
}

export function logoutPresence(): void {
  socket?.emit("logout_presence");
}

export function createConversation(participants: [string, string]): void {
  socket?.emit("create_conversation", { participants });
}

export function joinConversation(conversationId: string): void {
  socket?.emit("join_conversation", { conversationId });
}

export function sendMessage(conversationId: string, content: string): void {
  socket?.emit("send_message", { conversationId, content });
}

export function markRead(conversationId: string, messageId: string): void {
  socket?.emit("mark_read", { conversationId, messageId });
}

// Marks every unread message in the conversation read and zeroes the unread
// counter in one call - don't loop mark_read per message.
export function markConversationRead(conversationId: string): void {
  socket?.emit("mark_conversation_read", { conversationId });
}

export function startTyping(conversationId: string): void {
  socket?.emit("typing_start", { conversationId });
}

export function stopTyping(conversationId: string): void {
  socket?.emit("typing_stop", { conversationId });
}

export type { ServerToClientEvents, ClientToServerEvents, MessagingSocket };
