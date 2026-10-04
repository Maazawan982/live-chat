export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  bio: string;
}

export interface RoomLastMessage {
  content: string;
  senderName: string;
  senderId: string;
  createdAtFormatted: string;
  timestamp: number;
}

export interface Room {
  id: string;
  name: string;
  description: string;
  isDirectMessage: boolean;
  participantIds: string[];
  createdAt: number;
  createdById: string;
  topic?: string;
  unreadCount?: number;
  lastMessage?: RoomLastMessage;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  receiverId?: string;
  receiverName?: string;
  content: string;
  timestamp: number;
  createdAtFormatted: string;
  type: 'text' | 'image' | 'system';
  reactions?: Record<string, string[]>;
}

export interface CallLog {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar: string;
  callType: 'voice' | 'video';
  status: 'completed' | 'missed' | 'declined';
  durationSeconds: number;
  timestamp: number;
  formattedTime: string;
}

export interface ActiveCallSession {
  targetId: string;
  targetName: string;
  targetAvatar: string;
  targetSubtitle?: string;
  callType: 'voice' | 'video';
  isIncoming?: boolean;
}

export type BottomNavTab = 'chats' | 'channels' | 'calls' | 'account';

export interface TypingState {
  roomId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';
