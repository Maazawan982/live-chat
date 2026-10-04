import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { storage, User, Message, createSvgAvatar } from './server/storage.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'realtime-chat-secret-token-key-2026';
const isProduction = process.env.NODE_ENV === 'production';

// Express Application Setup
const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Socket.IO Server Setup
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

// User Session to Socket ID mappings
// Map<userId, Set<socketId>>: Allows a user to have multiple tabs open seamlessly
const userSocketsMap = new Map<string, Set<string>>();
// Map<socketId, User>: Quick lookup of user from socket
const socketUserMap = new Map<string, User>();

// Helper to generate JWT token for user
export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      avatar: user.avatar,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ---------------------------------------------------------------------------
// Step 2: Authentication Integration (WebSocket Handshake Verification)
// ---------------------------------------------------------------------------
io.use((socket: Socket, next: (err?: Error) => void) => {
  // Extract token from socket handshake auth object or headers
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers['x-auth-token'] as string | undefined) ||
    socket.handshake.query?.token;

  if (!token || typeof token !== 'string') {
    return next(new Error('AUTHENTICATION_REJECTED: No token provided in connection handshake'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    const user = storage.getUserById(decoded.id);

    if (!user) {
      return next(new Error('AUTHENTICATION_REJECTED: User does not exist'));
    }

    // Attach verified user payload to the socket session
    socket.data.user = user;
    next();
  } catch (err: unknown) {
    console.error('Socket authentication handshake failed:', (err as Error).message);
    return next(new Error('AUTHENTICATION_REJECTED: Invalid or expired token'));
  }
});

// ---------------------------------------------------------------------------
// Step 1: WebSocket Architecture & Step 3: Rooms and Persistence
// ---------------------------------------------------------------------------
io.on('connection', (socket: Socket) => {
  const user: User = socket.data.user;
  if (!user) {
    socket.disconnect(true);
    return;
  }

  // 1. Map authenticated user to unique internal socket ID
  if (!userSocketsMap.has(user.id)) {
    userSocketsMap.set(user.id, new Set());
  }
  userSocketsMap.get(user.id)!.add(socket.id);
  socketUserMap.set(socket.id, user);

  // Update user state to 'online' if this is their first active socket
  const isFirstConnection = userSocketsMap.get(user.id)!.size === 1;
  if (isFirstConnection) {
    storage.updateUserStatus(user.id, 'online');
    // Broadcast status change to all connected clients
    io.emit('user:presence', {
      userId: user.id,
      status: 'online',
      lastSeen: Date.now(),
    });
  }

  // Also join a private user room for direct user-targeted notifications
  socket.join(`user:${user.id}`);

  // Auto-join default public channels
  const allRooms = storage.getRooms();
  for (const r of allRooms) {
    if (!r.isDirectMessage) {
      socket.join(r.id);
    }
  }

  // Send initial handshake acknowledgment with active user statuses
  const onlineUserIds = Array.from(userSocketsMap.entries())
    .filter(([_, set]) => set.size > 0)
    .map(([uid]) => uid);

  socket.emit('connection:established', {
    socketId: socket.id,
    userId: user.id,
    serverTime: Date.now(),
    onlineUsers: onlineUserIds,
  });

  // 2. Room Join Event
  socket.on('room:join', ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.join(roomId);
  });

  // 3. Room Leave Event
  socket.on('room:leave', ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.leave(roomId);
  });

  // 4. Send Message Event (Step 3: Message Persistence & Rooms)
  socket.on('message:send', (payload: { roomId: string; content: string; receiverId?: string }) => {
    const { roomId, content, receiverId } = payload;
    if (!roomId || !content || !content.trim()) return;

    let receiverName = undefined;
    if (receiverId) {
      const targetUser = storage.getUserById(receiverId);
      receiverName = targetUser?.displayName;
    }

    // Persist to database storage
    const savedMessage = storage.addMessage({
      roomId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      receiverId,
      receiverName,
      content: content.trim(),
      timestamp: Date.now(),
      type: 'text',
      reactions: {},
    });

    // Make sure sender is in the room so they also receive or room members receive
    socket.join(roomId);

    // If it's a direct message room, ensure the receiver's active sockets also join this room
    if (receiverId && userSocketsMap.has(receiverId)) {
      const recipientSockets = userSocketsMap.get(receiverId)!;
      for (const sId of recipientSockets) {
        const recipientSocket = io.sockets.sockets.get(sId);
        if (recipientSocket) {
          recipientSocket.join(roomId);
        }
      }
    }

    // Broadcast saved message to the specific room
    io.to(roomId).emit('message:new', savedMessage);

    // Also send an incoming notification to direct recipient if it's a DM
    if (receiverId) {
      io.to(`user:${receiverId}`).emit('message:notification', {
        roomId,
        message: savedMessage,
      });
    }
  });

  // 5. Typing Indicators (Step 4)
  socket.on('typing:start', ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing:update', {
      roomId,
      userId: user.id,
      username: user.displayName,
      isTyping: true,
    });
  });

  socket.on('typing:stop', ({ roomId }: { roomId: string }) => {
    if (!roomId) return;
    socket.to(roomId).emit('typing:update', {
      roomId,
      userId: user.id,
      username: user.displayName,
      isTyping: false,
    });
  });

  // 6. Message Reaction
  socket.on('message:react', ({ messageId, emoji, roomId }: { messageId: string; emoji: string; roomId: string }) => {
    if (!messageId || !emoji || !roomId) return;
    const updated = storage.toggleReaction(messageId, emoji, user.id);
    if (updated) {
      io.to(roomId).emit('message:reaction_update', {
        messageId,
        reactions: updated.reactions,
      });
    }
  });

  // 6b. Real-Time Voice & Video Call Signaling
  socket.on('call:start', ({ targetUserId, callType }: { targetUserId: string; callType: 'voice' | 'video' }) => {
    if (!targetUserId) return;
    const targetUser = storage.getUserById(targetUserId);
    if (!targetUser) return;

    io.to(`user:${targetUserId}`).emit('call:incoming', {
      callerId: user.id,
      callerName: user.displayName,
      callerAvatar: user.avatar,
      callType,
      timestamp: Date.now(),
    });
  });

  socket.on(
    'call:end',
    (payload: {
      targetUserId: string;
      callType: 'voice' | 'video';
      durationSeconds: number;
      status: 'completed' | 'missed' | 'declined';
    }) => {
      const targetUser = storage.getUserById(payload.targetUserId);
      const receiverName = targetUser?.displayName || 'Team Channel';
      const receiverAvatar = targetUser?.avatar || createSvgAvatar('CH', '#00a884');

      const savedCall = storage.addCall({
        callerId: user.id,
        callerName: user.displayName,
        callerAvatar: user.avatar,
        receiverId: payload.targetUserId,
        receiverName,
        receiverAvatar,
        callType: payload.callType,
        status: payload.status,
        durationSeconds: payload.durationSeconds,
        timestamp: Date.now(),
      });

      io.emit('call:log_added', savedCall);
    }
  );

  // 7. Disconnection Lifecycle Handling
  socket.on('disconnect', () => {
    const userSockets = userSocketsMap.get(user.id);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        userSocketsMap.delete(user.id);
        const lastSeen = Date.now();
        storage.updateUserStatus(user.id, 'offline');
        // Broadcast presence change
        io.emit('user:presence', {
          userId: user.id,
          status: 'offline',
          lastSeen,
        });
      }
    }
    socketUserMap.delete(socket.id);
  });
});

// ---------------------------------------------------------------------------
// HTTP API Endpoints (Auth, Rooms, Messages)
// ---------------------------------------------------------------------------

// Middleware for authenticated REST routes
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const user = storage.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    (req as any).user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalid or expired' });
  }
}

// 1. Auth: Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  let user = storage.getUserByUsername(username);

  // If user does not exist, auto-create for seamless developer/intern testing experience!
  if (!user) {
    const displayName = username
      .split('_')
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    
    const initials = displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const colors = ['#00a884', '#0284c7', '#7c3aed', '#e11d48', '#d97706'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    user = storage.createUser({
      id: `user_${Date.now().toString(36)}`,
      username: username.toLowerCase().trim(),
      displayName,
      email: `${username.toLowerCase()}@example.com`,
      avatar: createSvgAvatar(initials || 'U', randomColor),
      status: 'offline',
      lastSeen: Date.now(),
      bio: 'Available on WhatsApp Web',
    });
  }

  const token = generateToken(user);
  return res.json({ token, user });
});

// 2. Auth: Register
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { username, displayName, bio } = req.body;
  if (!username || !displayName) {
    return res.status(400).json({ error: 'Username and display name are required' });
  }

  const existing = storage.getUserByUsername(username);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const initials = displayName
    .trim()
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const newUser = storage.createUser({
    id: `user_${Date.now().toString(36)}`,
    username: username.toLowerCase().trim(),
    displayName: displayName.trim(),
    email: `${username.toLowerCase()}@example.com`,
    avatar: createSvgAvatar(initials || 'U', '#00a884'),
    status: 'offline',
    lastSeen: Date.now(),
    bio: bio || 'Available',
  });

  const token = generateToken(newUser);
  return res.status(201).json({ token, user: newUser });
});

// 3. Auth: Current User Verification
app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  return res.json({ user });
});

// 4. Users List (with dynamic online presence)
app.get('/api/users', requireAuth, (req: Request, res: Response) => {
  const currentUserId = (req as any).user.id;
  const users = storage.getUsers().map((u) => {
    const isOnline = userSocketsMap.has(u.id) && userSocketsMap.get(u.id)!.size > 0;
    return {
      ...u,
      status: isOnline ? 'online' : 'offline',
    };
  });
  return res.json({ users });
});

// 5. Rooms List (with latest message preview for WhatsApp list view)
app.get('/api/rooms', requireAuth, (req: Request, res: Response) => {
  const currentUserId = (req as any).user.id;
  const allRooms = storage.getRooms();
  const userRooms = allRooms
    .filter((r) => !r.isDirectMessage || r.participantIds.includes(currentUserId))
    .map((r) => {
      const lastMsg = storage.getLastMessageByRoom(r.id);
      return {
        ...r,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              senderName: lastMsg.senderName,
              senderId: lastMsg.senderId,
              createdAtFormatted: lastMsg.createdAtFormatted,
              timestamp: lastMsg.timestamp,
            }
          : undefined,
      };
    });
  return res.json({ rooms: userRooms });
});

// 6. Create or Get Direct Message Room
app.post('/api/rooms/direct', requireAuth, (req: Request, res: Response) => {
  const currentUserId = (req as any).user.id;
  const { targetUserId } = req.body;

  if (!targetUserId) {
    return res.status(400).json({ error: 'targetUserId is required' });
  }

  const targetUser = storage.getUserById(targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Target user not found' });
  }

  const room = storage.getOrCreateDirectMessageRoom(currentUserId, targetUserId);
  return res.json({ room });
});

// 7. Create Public Channel Room
app.post('/api/rooms', requireAuth, (req: Request, res: Response) => {
  const currentUserId = (req as any).user.id;
  const { name, description, topic } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Room name is required' });
  }

  const newRoom = storage.createRoom(name, description || '', currentUserId, topic);
  
  // Notify all connected sockets about new public room
  io.emit('room:created', newRoom);
  return res.status(201).json({ room: newRoom });
});

// 8. Room Messages History (Persistent)
app.get('/api/rooms/:roomId/messages', requireAuth, (req: Request, res: Response) => {
  const { roomId } = req.params;
  const messages = storage.getMessagesByRoom(roomId, 100);
  return res.json({ messages });
});

// 9. Call Logs History
app.get('/api/calls', requireAuth, (_req: Request, res: Response) => {
  const calls = storage.getCalls();
  return res.json({ calls });
});

// ---------------------------------------------------------------------------
// Vite Dev Middleware / Production Static Asset Serving
// ---------------------------------------------------------------------------
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode');
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving production static bundle from dist');
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] LiveChat WebSocket & HTTP Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal error during startup:', err);
  process.exit(1);
});
