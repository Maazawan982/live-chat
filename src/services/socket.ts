import { io, Socket } from 'socket.io-client';
import { Message, TypingState, CallLog } from '../types.ts';

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

class SocketService {
  private socket: Socket | null = null;
  private messageListeners = new Set<MessageCallback>();
  private reactionListeners = new Set<ReactionCallback>();
  private presenceListeners = new Set<PresenceCallback>();
  private typingListeners = new Set<TypingCallback>();
  private connectionListeners = new Set<ConnectionCallback>();
  private incomingCallListeners = new Set<IncomingCallCallback>();
  private callLogListeners = new Set<CallLogCallback>();

  public connect(token: string): Socket {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Step 2: Pass token in socket handshake auth
    this.socket = io({
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connection:established', (data) => {
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

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection handshake error:', err.message);
    });

    return this.socket;
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return !!this.socket?.connected;
  }

  public joinRoom(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('room:join', { roomId });
  }

  public leaveRoom(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('room:leave', { roomId });
  }

  public sendMessage(roomId: string, content: string, receiverId?: string): void {
    if (!this.socket) return;
    this.socket.emit('message:send', { roomId, content, receiverId });
  }

  public startTyping(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:start', { roomId });
  }

  public stopTyping(roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('typing:stop', { roomId });
  }

  public reactToMessage(messageId: string, emoji: string, roomId: string): void {
    if (!this.socket) return;
    this.socket.emit('message:react', { messageId, emoji, roomId });
  }

  public startCall(targetUserId: string, callType: 'voice' | 'video'): void {
    if (!this.socket) return;
    this.socket.emit('call:start', { targetUserId, callType });
  }

  public endCall(
    targetUserId: string,
    callType: 'voice' | 'video',
    durationSeconds: number,
    status: 'completed' | 'missed' | 'declined' = 'completed'
  ): void {
    if (!this.socket) return;
    this.socket.emit('call:end', {
      targetUserId,
      callType,
      durationSeconds,
      status,
    });
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
  }
}

export const socketService = new SocketService();
