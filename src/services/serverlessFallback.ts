import { User, Room, Message, CallLog } from '../types.ts';

function createSvgAvatar(initials: string, bgHex: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <rect width="120" height="120" rx="60" fill="${bgHex}"/>
    <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="600">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const AVATAR_MAAZ = createSvgAvatar('MA', '#00a884');
const AVATAR_SARAH = createSvgAvatar('SM', '#0284c7');
const AVATAR_MARCUS = createSvgAvatar('MV', '#7c3aed');
const AVATAR_ELENA = createSvgAvatar('ER', '#e11d48');

const now = Date.now();
const formatTime = (ts: number) =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const INITIAL_USERS: User[] = [
  {
    id: 'user_maaz',
    username: 'maaz_awan',
    displayName: 'Maaz Awan',
    email: 'maazawan2468@gmail.com',
    avatar: AVATAR_MAAZ,
    status: 'online',
    lastSeen: now,
    bio: 'Available · Full Stack Engineer & Real-Time Systems',
  },
  {
    id: 'user_sarah',
    username: 'sarah_m',
    displayName: 'Sarah Miller',
    email: 'sarah.miller@example.com',
    avatar: AVATAR_SARAH,
    status: 'online',
    lastSeen: now - 1000 * 60 * 5,
    bio: 'At work · Product Designer & UI Architect',
  },
  {
    id: 'user_marcus',
    username: 'marcus_v',
    displayName: 'Marcus Vance',
    email: 'marcus.v@example.com',
    avatar: AVATAR_MARCUS,
    status: 'online',
    lastSeen: now - 1000 * 60 * 15,
    bio: 'Coding · Backend Architect & WebSockets',
  },
  {
    id: 'user_elena',
    username: 'elena_rostova',
    displayName: 'Elena Rostova',
    email: 'elena.r@example.com',
    avatar: AVATAR_ELENA,
    status: 'offline',
    lastSeen: now - 1000 * 60 * 55,
    bio: 'In a meeting · Frontend Engineer',
  },
];

const INITIAL_ROOMS: Room[] = [
  {
    id: 'room_general',
    name: 'general',
    description: 'Team-wide updates, daily standups, and general announcements',
    isDirectMessage: false,
    participantIds: [],
    createdAt: now - 86400000 * 3,
    createdById: 'user_maaz',
    topic: 'Team-wide announcements and daily discussions',
  },
  {
    id: 'room_engineering',
    name: 'engineering',
    description: 'WebSocket architecture, backend protocols, and code deployments',
    isDirectMessage: false,
    participantIds: [],
    createdAt: now - 86400000 * 2,
    createdById: 'user_marcus',
    topic: 'Real-time WebSocket protocol pipelines & state sync',
  },
  {
    id: 'room_product_design',
    name: 'product-design',
    description: 'UI/UX design critiques, WhatsApp layout flows, and mobile ergonomics',
    isDirectMessage: false,
    participantIds: [],
    createdAt: now - 86400000 * 2,
    createdById: 'user_sarah',
    topic: 'Design systems, mobile bottom navigation, and responsive UI',
  },
  {
    id: 'room_random',
    name: 'random',
    description: 'Casual watercooler chat, coffee recommendations, and links',
    isDirectMessage: false,
    participantIds: [],
    createdAt: now - 86400000,
    createdById: 'user_elena',
    topic: 'Relax and catch up with the team',
  },
  {
    id: 'dm_user_maaz_user_sarah',
    name: 'Maaz Awan & Sarah Miller',
    description: 'Direct conversation between Maaz Awan and Sarah Miller',
    isDirectMessage: true,
    participantIds: ['user_maaz', 'user_sarah'],
    createdAt: now - 3600000 * 5,
    createdById: 'user_maaz',
    topic: 'Direct Message',
  },
  {
    id: 'dm_user_maaz_user_marcus',
    name: 'Maaz Awan & Marcus Vance',
    description: 'Direct conversation between Maaz Awan and Marcus Vance',
    isDirectMessage: true,
    participantIds: ['user_maaz', 'user_marcus'],
    createdAt: now - 3600000 * 4,
    createdById: 'user_maaz',
    topic: 'Direct Message',
  },
  {
    id: 'dm_user_elena_user_maaz',
    name: 'Elena Rostova & Maaz Awan',
    description: 'Direct conversation between Elena Rostova and Maaz Awan',
    isDirectMessage: true,
    participantIds: ['user_elena', 'user_maaz'],
    createdAt: now - 3600000 * 3,
    createdById: 'user_elena',
    topic: 'Direct Message',
  },
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_init_1',
    roomId: 'room_general',
    senderId: 'user_maaz',
    senderName: 'Maaz Awan',
    senderAvatar: AVATAR_MAAZ,
    content:
      'Welcome to the team channel! Our real-time WebSocket messaging and voice/video calling pipeline is live.',
    timestamp: now - 1000 * 60 * 45,
    createdAtFormatted: formatTime(now - 1000 * 60 * 45),
    type: 'text',
    reactions: { '🚀': ['user_marcus', 'user_sarah'], '👍': ['user_elena'] },
  },
  {
    id: 'msg_init_2',
    roomId: 'room_general',
    senderId: 'user_sarah',
    senderName: 'Sarah Miller',
    senderAvatar: AVATAR_SARAH,
    content:
      'The WhatsApp-inspired layout with bottom navigation for Chats, Channels, and Calls feels super intuitive on both mobile and desktop!',
    timestamp: now - 1000 * 60 * 30,
    createdAtFormatted: formatTime(now - 1000 * 60 * 30),
    type: 'text',
    reactions: { '❤️': ['user_maaz'] },
  },
  {
    id: 'msg_init_3',
    roomId: 'room_engineering',
    senderId: 'user_marcus',
    senderName: 'Marcus Vance',
    senderAvatar: AVATAR_MARCUS,
    content:
      'Socket handshake authentication is verified with JWT tokens. All room broadcasts and call signaling events are protected.',
    timestamp: now - 1000 * 60 * 20,
    createdAtFormatted: formatTime(now - 1000 * 60 * 20),
    type: 'text',
    reactions: { '⚡': ['user_maaz'] },
  },
  {
    id: 'msg_init_4',
    roomId: 'room_engineering',
    senderId: 'user_maaz',
    senderName: 'Maaz Awan',
    senderAvatar: AVATAR_MAAZ,
    content:
      'Confirmed! Each authenticated user is mapped to internal socket IDs with automatic online/offline presence sync.',
    timestamp: now - 1000 * 60 * 15,
    createdAtFormatted: formatTime(now - 1000 * 60 * 15),
    type: 'text',
  },
  {
    id: 'msg_dm_1',
    roomId: 'dm_user_maaz_user_sarah',
    senderId: 'user_sarah',
    senderName: 'Sarah Miller',
    senderAvatar: AVATAR_SARAH,
    receiverId: 'user_maaz',
    receiverName: 'Maaz Awan',
    content:
      'Hey Maaz! Did you check the new WhatsApp-style bottom nav bar for switching between Direct Chats, Channels, and Calls?',
    timestamp: now - 1000 * 60 * 25,
    createdAtFormatted: formatTime(now - 1000 * 60 * 25),
    type: 'text',
  },
  {
    id: 'msg_dm_2',
    roomId: 'dm_user_maaz_user_sarah',
    senderId: 'user_maaz',
    senderName: 'Maaz Awan',
    senderAvatar: AVATAR_MAAZ,
    receiverId: 'user_sarah',
    receiverName: 'Sarah Miller',
    content:
      'Yes! Just tested it. We can also start live voice and video calls right from the chat header or the Calls tab.',
    timestamp: now - 1000 * 60 * 22,
    createdAtFormatted: formatTime(now - 1000 * 60 * 22),
    type: 'text',
    reactions: { '🔥': ['user_sarah'] },
  },
  {
    id: 'msg_dm_3',
    roomId: 'dm_user_maaz_user_marcus',
    senderId: 'user_marcus',
    senderName: 'Marcus Vance',
    senderAvatar: AVATAR_MARCUS,
    receiverId: 'user_maaz',
    receiverName: 'Maaz Awan',
    content:
      'Maaz, the WebSocket latency is under 15ms. Let me know when you are ready for our quick architecture sync call.',
    timestamp: now - 1000 * 60 * 50,
    createdAtFormatted: formatTime(now - 1000 * 60 * 50),
    type: 'text',
  },
  {
    id: 'msg_dm_4',
    roomId: 'dm_user_elena_user_maaz',
    senderId: 'user_elena',
    senderName: 'Elena Rostova',
    senderAvatar: AVATAR_ELENA,
    receiverId: 'user_maaz',
    receiverName: 'Maaz Awan',
    content: 'Hi Maaz! The responsive mobile and desktop views are ready for demonstration.',
    timestamp: now - 1000 * 60 * 80,
    createdAtFormatted: formatTime(now - 1000 * 60 * 80),
    type: 'text',
  },
];

const INITIAL_CALLS: CallLog[] = [
  {
    id: 'call_init_1',
    callerId: 'user_sarah',
    callerName: 'Sarah Miller',
    callerAvatar: AVATAR_SARAH,
    receiverId: 'user_maaz',
    receiverName: 'Maaz Awan',
    receiverAvatar: AVATAR_MAAZ,
    callType: 'video',
    status: 'completed',
    durationSeconds: 342,
    timestamp: now - 1000 * 60 * 35,
    formattedTime: formatTime(now - 1000 * 60 * 35),
  },
  {
    id: 'call_init_2',
    callerId: 'user_maaz',
    callerName: 'Maaz Awan',
    callerAvatar: AVATAR_MAAZ,
    receiverId: 'user_marcus',
    receiverName: 'Marcus Vance',
    receiverAvatar: AVATAR_MARCUS,
    callType: 'voice',
    status: 'completed',
    durationSeconds: 185,
    timestamp: now - 1000 * 60 * 95,
    formattedTime: formatTime(now - 1000 * 60 * 95),
  },
  {
    id: 'call_init_3',
    callerId: 'user_elena',
    callerName: 'Elena Rostova',
    callerAvatar: AVATAR_ELENA,
    receiverId: 'user_maaz',
    receiverName: 'Maaz Awan',
    receiverAvatar: AVATAR_MAAZ,
    callType: 'voice',
    status: 'missed',
    durationSeconds: 0,
    timestamp: now - 1000 * 60 * 180,
    formattedTime: formatTime(now - 1000 * 60 * 180),
  },
];

const STORAGE_KEY = 'livechat_serverless_db_v1';

interface LocalDB {
  users: User[];
  rooms: Room[];
  messages: Message[];
  calls: CallLog[];
}

function loadDB(): LocalDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        users: parsed.users || INITIAL_USERS,
        rooms: parsed.rooms || INITIAL_ROOMS,
        messages: parsed.messages || INITIAL_MESSAGES,
        calls: parsed.calls || INITIAL_CALLS,
      };
    }
  } catch {
    // ignore storage errors
  }
  const initial: LocalDB = {
    users: INITIAL_USERS,
    rooms: INITIAL_ROOMS,
    messages: INITIAL_MESSAGES,
    calls: INITIAL_CALLS,
  };
  saveDB(initial);
  return initial;
}

function saveDB(db: LocalDB): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors
  }
}

export const serverlessStore = {
  encodeToken(user: User): string {
    return `serverless_jwt_${encodeURIComponent(user.id)}`;
  },

  decodeToken(token: string): User | null {
    const db = loadDB();
    if (token.startsWith('serverless_jwt_')) {
      const userId = decodeURIComponent(token.replace('serverless_jwt_', ''));
      return db.users.find((u) => u.id === userId) || db.users[0];
    }
    return db.users[0];
  },

  login(username: string): { token: string; user: User } {
    const db = loadDB();
    let user = db.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );
    if (!user) {
      const displayName = username
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      const initials = displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
      user = {
        id: `user_${Date.now().toString(36)}`,
        username: username.toLowerCase().trim(),
        displayName,
        email: `${username.toLowerCase()}@example.com`,
        avatar: createSvgAvatar(initials || 'U', '#00a884'),
        status: 'online',
        lastSeen: Date.now(),
        bio: 'Available on LiveChat Web',
      };
      db.users.push(user);
      saveDB(db);
    } else {
      user.status = 'online';
      saveDB(db);
    }
    return { token: this.encodeToken(user), user };
  },

  register(username: string, displayName: string, bio?: string): { token: string; user: User } {
    const db = loadDB();
    const initials = displayName
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const user: User = {
      id: `user_${Date.now().toString(36)}`,
      username: username.toLowerCase().trim(),
      displayName: displayName.trim(),
      email: `${username.toLowerCase()}@example.com`,
      avatar: createSvgAvatar(initials || 'U', '#00a884'),
      status: 'online',
      lastSeen: Date.now(),
      bio: bio || 'Available',
    };
    db.users.push(user);
    saveDB(db);
    return { token: this.encodeToken(user), user };
  },

  getUsers(): User[] {
    return loadDB().users;
  },

  getRooms(currentUserId: string): Room[] {
    const db = loadDB();
    return db.rooms
      .filter((r) => !r.isDirectMessage || r.participantIds.includes(currentUserId))
      .map((r) => {
        const roomMsgs = db.messages.filter((m) => m.roomId === r.id);
        const lastMsg = roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : undefined;
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
  },

  createRoom(name: string, description: string, createdById: string, topic?: string): Room {
    const db = loadDB();
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const newRoom: Room = {
      id: `room_${cleanName}_${Date.now().toString(36)}`,
      name: cleanName,
      description,
      isDirectMessage: false,
      participantIds: [],
      createdAt: Date.now(),
      createdById,
      topic: topic || description,
    };
    db.rooms.push(newRoom);
    saveDB(db);
    return newRoom;
  },

  getOrCreateDirectRoom(user1Id: string, user2Id: string): Room {
    const db = loadDB();
    const sortedIds = [user1Id, user2Id].sort();
    const dmRoomId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
    let room = db.rooms.find((r) => r.id === dmRoomId);
    if (!room) {
      const u1 = db.users.find((u) => u.id === user1Id);
      const u2 = db.users.find((u) => u.id === user2Id);
      room = {
        id: dmRoomId,
        name: `${u1?.displayName || user1Id} & ${u2?.displayName || user2Id}`,
        description: `Direct conversation between ${u1?.displayName} and ${u2?.displayName}`,
        isDirectMessage: true,
        participantIds: sortedIds,
        createdAt: Date.now(),
        createdById: user1Id,
        topic: 'Direct Message',
      };
      db.rooms.push(room);
      saveDB(db);
    }
    return room;
  },

  getMessages(roomId: string): Message[] {
    const db = loadDB();
    return db.messages.filter((m) => m.roomId === roomId).slice(-100);
  },

  addMessage(user: User, roomId: string, content: string, receiverId?: string): Message {
    const db = loadDB();
    const receiver = receiverId ? db.users.find((u) => u.id === receiverId) : undefined;
    const ts = Date.now();
    const msg: Message = {
      id: `msg_${ts.toString(36)}_${Math.random().toString(36).substring(2, 7)}`,
      roomId,
      senderId: user.id,
      senderName: user.displayName,
      senderAvatar: user.avatar,
      receiverId,
      receiverName: receiver?.displayName,
      content: content.trim(),
      timestamp: ts,
      createdAtFormatted: formatTime(ts),
      type: 'text',
      reactions: {},
    };
    db.messages.push(msg);
    saveDB(db);
    return msg;
  },

  toggleReaction(messageId: string, emoji: string, userId: string): Message | null {
    const db = loadDB();
    const msg = db.messages.find((m) => m.id === messageId);
    if (!msg) return null;
    if (!msg.reactions) msg.reactions = {};
    if (!msg.reactions[emoji]) msg.reactions[emoji] = [];

    const idx = msg.reactions[emoji].indexOf(userId);
    if (idx > -1) {
      msg.reactions[emoji].splice(idx, 1);
      if (msg.reactions[emoji].length === 0) delete msg.reactions[emoji];
    } else {
      msg.reactions[emoji].push(userId);
    }
    saveDB(db);
    return msg;
  },

  getCalls(): CallLog[] {
    return loadDB().calls.sort((a, b) => b.timestamp - a.timestamp);
  },

  addCall(
    caller: User,
    targetUserId: string,
    callType: 'voice' | 'video',
    durationSeconds: number,
    status: 'completed' | 'missed' | 'declined'
  ): CallLog {
    const db = loadDB();
    const target = db.users.find((u) => u.id === targetUserId);
    const ts = Date.now();
    const newCall: CallLog = {
      id: `call_${ts.toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
      callerId: caller.id,
      callerName: caller.displayName,
      callerAvatar: caller.avatar,
      receiverId: targetUserId,
      receiverName: target?.displayName || 'Team Channel',
      receiverAvatar: target?.avatar || createSvgAvatar('CH', '#00a884'),
      callType,
      status,
      durationSeconds,
      timestamp: ts,
      formattedTime: formatTime(ts),
    };
    db.calls.unshift(newCall);
    saveDB(db);
    return newCall;
  },
};
