import { io, Socket } from 'socket.io-client';
import { Message, TypingState, CallLog, User } from '../types.ts';
import { serverlessStore } from './serverlessFallback.ts';

type MessageCallback = (message: Message) => void;
type ReactionCallback = (data: { messageId: string; reactions: Record<string, string[]> }) => void;
type PresenceCallback = (data: { userId: string; status: 'online' | 'offline'; lastSeen: number }) => void;
type TypingCallback = (data: TypingState) => void;
type ConnectionCallback = (data: { socketId: string; serverTime: number; onlineUsers: string[] }) => void;
type IncomingCallCallback = (data: {
  callerId: string;
  callerName: string;
  callerAvatar: string;
  callType: 'voice' | 'video';
  timestamp: number;
}) => void;
type CallLogCallback = (call: CallLog) => void;

const SOCKET_URL = (import.meta as any).env?.VITE_SOCKET_URL || undefined;

class SocketService {
  private socket: Socket | null = null;
  private isServerlessFallback = false;
  private currentUser: User | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private virtualSocketId = `vercel_rt_${Math.random().toString(36).substring(2, 9)}`;

  private messageListeners = new Set<MessageCallback>();
  private reactionListeners = new Set<ReactionCallback>();
  private presenceListeners = new Set<PresenceCallback>();
  private typingListeners = new Set<TypingCallback>();
  private connectionListeners = new Set<ConnectionCallback>();
  private incomingCallListeners = new Set<IncomingCallCallback>();
  private callLogListeners = new Set<CallLogCallback>();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('livechat_realtime_bus');
      this.broadcastChannel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'message:new') {
          this.messageListeners.forEach((cb) => cb(payload));
        } else if (type === 'message:reaction_update') {
          this.reactionListeners.forEach((cb) => cb(payload));
        } else if (type === 'typing:update') {
          this.typingListeners.forEach((cb) => cb(payload));
        } else if (type === 'call:incoming') {
          this.incomingCallListeners.forEach((cb) => cb(payload));
        } else if (type === 'call:log_added') {
          this.callLogListeners.forEach((cb) => cb(payload));
        } else if (type === 'user:presence') {
          this.presenceListeners.forEach((cb) => cb(payload));
        }
      };
    }
  }

  private activateServerlessRealtime(): void {
    if (this.isServerlessFallback) return;
    this.isServerlessFallback = true;

    const onlineUsers = ['user_maaz', 'user_sarah', 'user_marcus'];
    if (this.currentUser && !onlineUsers.includes(this.currentUser.id)) {
      onlineUsers.push(this.currentUser.id);
    }

    this.connectionListeners.forEach((cb) =>
      cb({
        socketId: this.virtualSocketId,
        serverTime: Date.now(),
        onlineUsers,
      })
    );
  }

  public connect(token: string): Socket | null {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.currentUser = serverlessStore.decodeToken(token);

    // If token was issued by the client-side Vercel/Serverless store, activate serverless real-time immediately
    if (token.startsWith('serverless_jwt_') && !SOCKET_URL) {
      this.activateServerlessRealtime();
      return null;
    }

    this.isServerlessFallback = false;

    this.socket = SOCKET_URL
      ? io(SOCKET_URL, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          timeout: 2500,
        })
      : io({
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnectionAttempts: 3,
          timeout: 2500,
        });

    // Fallback timer so Vercel deployments never hang waiting for a persistent WebSocket daemon
    const fallbackTimer = setTimeout(() => {
      if (!this.socket?.connected) {
        this.activateServerlessRealtime();
      }
    }, 2000);

    this.socket.on('connection:established', (data) => {
      clearTimeout(fallbackTimer);
      this.isServerlessFallback = false;
      this.connectionListeners.forEach((cb) => cb(data));
    });

    this.socket.on('message:new', (message: Message) => {
      this.messageListeners.forEach((cb) => cb(message));
    });

    this.socket.on('message:reaction_update', (data) => {
      this.reactionListeners.forEach((cb) => cb(data));
    });

    this.socket.on('user:presence', (data) => {
      this.presenceListeners.forEach((cb) => cb(data));
    });

    this.socket.on('typing:update', (data: TypingState) => {
      this.typingListeners.forEach((cb) => cb(data));
    });

    this.socket.on('call:incoming', (data) => {
      this.incomingCallListeners.forEach((cb) => cb(data));
    });

    this.socket.on('call:log_added', (call: CallLog) => {
      this.callLogListeners.forEach((cb) => cb(call));
    });

    this.socket.on('connect_error', () => {
      clearTimeout(fallbackTimer);
      if (this.socket) {
        this.socket.disconnect();
      }
      this.activateServerlessRealtime();
    });

    return this.socket;
  }

  public getSocket(): { id: string; connected: boolean } | Socket | null {
    if (this.socket?.connected) {
      return this.socket;
    }
    if (this.isServerlessFallback) {
      return {
        id: this.virtualSocketId,
        connected: true,
      };
    }
    return this.socket;
  }

  public isConnected(): boolean {
    return !!this.socket?.connected || this.isServerlessFallback;
  }

  public joinRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('room:join', { roomId });
    }
  }

  public leaveRoom(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('room:leave', { roomId });
    }
  }

  public sendMessage(roomId: string, content: string, receiverId?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message:send', { roomId, content, receiverId });
      return;
    }

    // Serverless / Vercel mode: persist locally and broadcast across open browser tabs
    const sender = this.currentUser || serverlessStore.getUsers()[0];
    const savedMsg = serverlessStore.addMessage(sender, roomId, content, receiverId);
    this.messageListeners.forEach((cb) => cb(savedMsg));
    this.broadcastChannel?.postMessage({ type: 'message:new', payload: savedMsg });
  }

  public startTyping(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { roomId });
      return;
    }

    if (this.currentUser) {
      const payload: TypingState = {
        roomId,
        userId: this.currentUser.id,
        username: this.currentUser.displayName,
        isTyping: true,
      };
      this.broadcastChannel?.postMessage({ type: 'typing:update', payload });
    }
  }

  public stopTyping(roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { roomId });
      return;
    }

    if (this.currentUser) {
      const payload: TypingState = {
        roomId,
        userId: this.currentUser.id,
        username: this.currentUser.displayName,
        isTyping: false,
      };
      this.broadcastChannel?.postMessage({ type: 'typing:update', payload });
    }
  }

  public reactToMessage(messageId: string, emoji: string, roomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message:react', { messageId, emoji, roomId });
      return;
    }

    const userId = this.currentUser?.id || 'user_maaz';
    const updated = serverlessStore.toggleReaction(messageId, emoji, userId);
    if (updated) {
      const payload = { messageId, reactions: updated.reactions || {} };
      this.reactionListeners.forEach((cb) => cb(payload));
      this.broadcastChannel?.postMessage({ type: 'message:reaction_update', payload });
    }
  }

  public startCall(targetUserId: string, callType: 'voice' | 'video'): void {
    if (this.socket?.connected) {
      this.socket.emit('call:start', { targetUserId, callType });
      return;
    }

    if (this.currentUser) {
      const payload = {
        callerId: this.currentUser.id,
        callerName: this.currentUser.displayName,
        callerAvatar: this.currentUser.avatar,
        callType,
        timestamp: Date.now(),
      };
      this.broadcastChannel?.postMessage({ type: 'call:incoming', payload });
    }
  }

  public endCall(
    targetUserId: string,
    callType: 'voice' | 'video',
    durationSeconds: number,
    status: 'completed' | 'missed' | 'declined' = 'completed'
  ): void {
    if (this.socket?.connected) {
      this.socket.emit('call:end', {
        targetUserId,
        callType,
        durationSeconds,
        status,
      });
      return;
    }

    const caller = this.currentUser || serverlessStore.getUsers()[0];
    const savedCall = serverlessStore.addCall(
      caller,
      targetUserId,
      callType,
      durationSeconds,
      status
    );
    this.callLogListeners.forEach((cb) => cb(savedCall));
    this.broadcastChannel?.postMessage({ type: 'call:log_added', payload: savedCall });
  }

  public onMessage(cb: MessageCallback): () => void {
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  public onReaction(cb: ReactionCallback): () => void {
    this.reactionListeners.add(cb);
    return () => this.reactionListeners.delete(cb);
  }

  public onPresence(cb: PresenceCallback): () => void {
    this.presenceListeners.add(cb);
    return () => this.presenceListeners.delete(cb);
  }

  public onTyping(cb: TypingCallback): () => void {
    this.typingListeners.add(cb);
    return () => this.typingListeners.delete(cb);
  }

  public onConnection(cb: ConnectionCallback): () => void {
    this.connectionListeners.add(cb);
    return () => this.connectionListeners.delete(cb);
  }

  public onIncomingCall(cb: IncomingCallCallback): () => void {
    this.incomingCallListeners.add(cb);
    return () => this.incomingCallListeners.delete(cb);
  }

  public onCallLogAdded(cb: CallLogCallback): () => void {
    this.callLogListeners.add(cb);
    return () => this.callLogListeners.delete(cb);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isServerlessFallback = false;
  }
}

export const socketService = new SocketService();
