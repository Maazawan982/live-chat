import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  bio: string;
  passwordHash?: string;
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
}

export interface MessageReaction {
  emoji: string;
  users: string[];
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

interface DatabaseSchema {
  users: User[];
  rooms: Room[];
  messages: Message[];
  calls: CallLog[];
}

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'chat_storage.json');

export function createSvgAvatar(initials: string, bgHex: string): string {
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

const INITIAL_USERS: User[] = [
  {
    id: 'user_maaz',
    username: 'maaz_awan',
    displayName: 'Maaz Awan',
    email: 'maazawan2468@gmail.com',
    avatar: AVATAR_MAAZ,
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 2,
    bio: 'Available · Full Stack Engineer & Real-Time Systems',
  },
  {
    id: 'user_sarah',
    username: 'sarah_m',
    displayName: 'Sarah Miller',
    email: 'sarah.miller@example.com',
    avatar: AVATAR_SARAH,
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 12,
    bio: 'At work · Product Designer & UI Architect',
  },
  {
    id: 'user_marcus',
    username: 'marcus_v',
    displayName: 'Marcus Vance',
    email: 'marcus.v@example.com',
    avatar: AVATAR_MARCUS,
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 30,
    bio: 'Coding · Backend Architect & WebSockets',
  },
  {
    id: 'user_elena',
    username: 'elena_rostova',
    displayName: 'Elena Rostova',
    email: 'elena.r@example.com',
    avatar: AVATAR_ELENA,
    status: 'offline',
    lastSeen: Date.now() - 1000 * 60 * 55,
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
    createdAt: Date.now() - 86400000 * 3,
    createdById: 'user_maaz',
    topic: 'Team-wide announcements and daily discussions',
  },
  {
    id: 'room_engineering',
    name: 'engineering',
    description: 'WebSocket architecture, backend protocols, and code deployments',
    isDirectMessage: false,
    participantIds: [],
    createdAt: Date.now() - 86400000 * 2,
    createdById: 'user_marcus',
    topic: 'Real-time WebSocket protocol pipelines & state sync',
  },
  {
    id: 'room_product_design',
    name: 'product-design',
    description: 'UI/UX design critiques, WhatsApp layout flows, and mobile ergonomics',
    isDirectMessage: false,
    participantIds: [],
    createdAt: Date.now() - 86400000 * 2,
    createdById: 'user_sarah',
    topic: 'Design systems, mobile bottom navigation, and responsive UI',
  },
  {
    id: 'room_random',
    name: 'random',
    description: 'Casual watercooler chat, coffee recommendations, and links',
    isDirectMessage: false,
    participantIds: [],
    createdAt: Date.now() - 86400000,
    createdById: 'user_elena',
    topic: 'Relax and catch up with the team',
  },
  {
    id: 'dm_user_maaz_user_sarah',
    name: 'Maaz Awan & Sarah Miller',
    description: 'Direct conversation between Maaz Awan and Sarah Miller',
    isDirectMessage: true,
    participantIds: ['user_maaz', 'user_sarah'],
    createdAt: Date.now() - 3600000 * 5,
    createdById: 'user_maaz',
    topic: 'Direct Message',
  },
  {
    id: 'dm_user_maaz_user_marcus',
    name: 'Maaz Awan & Marcus Vance',
    description: 'Direct conversation between Maaz Awan and Marcus Vance',
    isDirectMessage: true,
    participantIds: ['user_maaz', 'user_marcus'],
    createdAt: Date.now() - 3600000 * 4,
    createdById: 'user_maaz',
    topic: 'Direct Message',
  },
  {
    id: 'dm_user_elena_user_maaz',
    name: 'Elena Rostova & Maaz Awan',
    description: 'Direct conversation between Elena Rostova and Maaz Awan',
    isDirectMessage: true,
    participantIds: ['user_elena', 'user_maaz'],
    createdAt: Date.now() - 3600000 * 3,
    createdById: 'user_elena',
    topic: 'Direct Message',
  },
];

const now = Date.now();
const formatTime = (ts: number) => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg_init_1',
    roomId: 'room_general',
    senderId: 'user_maaz',
    senderName: 'Maaz Awan',
    senderAvatar: AVATAR_MAAZ,
    content: 'Welcome to the team channel! Our real-time WebSocket messaging and voice/video calling pipeline is live.',
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
    content: 'The WhatsApp-inspired layout with bottom navigation for Chats, Channels, and Calls feels super intuitive on both mobile and desktop!',
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
    content: 'Socket handshake authentication is verified with JWT tokens. All room broadcasts and call signaling events are protected.',
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
    content: 'Confirmed! Each authenticated user is mapped to internal socket IDs with automatic online/offline presence sync.',
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
    content: 'Hey Maaz! Did you check the new WhatsApp-style bottom nav bar for switching between Direct Chats, Channels, and Calls?',
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
    content: 'Yes! Just tested it. We can also start live voice and video calls right from the chat header or the Calls tab.',
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
    content: 'Maaz, the WebSocket latency is under 15ms. Let me know when you are ready for our quick architecture sync call.',
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

class StorageManager {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || INITIAL_USERS,
          rooms: parsed.rooms || INITIAL_ROOMS,
          messages: parsed.messages || INITIAL_MESSAGES,
          calls: parsed.calls || INITIAL_CALLS,
        };
      }
    } catch (e) {
      console.error('Failed to load database file, creating fresh store', e);
    }

    const initialData: DatabaseSchema = {
      users: INITIAL_USERS,
      rooms: INITIAL_ROOMS,
      messages: INITIAL_MESSAGES,
      calls: INITIAL_CALLS,
    };
    this.saveData(initialData);
    return initialData;
  }

  private saveData(data: DatabaseSchema = this.data): void {
    try {
      this.ensureDataDirectory();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database file', e);
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return [...this.data.users];
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase().trim()
    );
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.saveData();
    return user;
  }

  public updateUserStatus(userId: string, status: 'online' | 'offline' | 'away'): void {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      if (status === 'offline') {
        user.lastSeen = Date.now();
      }
      this.saveData();
    }
  }

  // --- Rooms ---
  public getRooms(): Room[] {
    return [...this.data.rooms];
  }

  public getRoomById(id: string): Room | undefined {
    return this.data.rooms.find((r) => r.id === id);
  }

  public getOrCreateDirectMessageRoom(user1Id: string, user2Id: string): Room {
    const sortedIds = [user1Id, user2Id].sort();
    const dmRoomId = `dm_${sortedIds[0]}_${sortedIds[1]}`;

    let room = this.data.rooms.find((r) => r.id === dmRoomId);
    if (!room) {
      const u1 = this.getUserById(user1Id);
      const u2 = this.getUserById(user2Id);
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
      this.data.rooms.push(room);
      this.saveData();
    }
    return room;
  }

  public createRoom(name: string, description: string, createdById: string, topic?: string): Room {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const roomId = `room_${cleanName}_${Date.now().toString(36)}`;
    const newRoom: Room = {
      id: roomId,
      name: cleanName,
      description,
      isDirectMessage: false,
      participantIds: [],
      createdAt: Date.now(),
      createdById,
      topic: topic || description,
    };
    this.data.rooms.push(newRoom);
    this.saveData();
    return newRoom;
  }

  // --- Messages ---
  public getMessagesByRoom(roomId: string, limit: number = 100): Message[] {
    return this.data.messages
      .filter((m) => m.roomId === roomId)
      .slice(-limit);
  }

  public getLastMessageByRoom(roomId: string): Message | undefined {
    const roomMsgs = this.data.messages.filter((m) => m.roomId === roomId);
    return roomMsgs.length > 0 ? roomMsgs[roomMsgs.length - 1] : undefined;
  }

  public addMessage(message: Omit<Message, 'id' | 'createdAtFormatted'>): Message {
    const id = `msg_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const createdAtFormatted = formatTime(message.timestamp);

    const fullMessage: Message = {
      ...message,
      id,
      createdAtFormatted,
      reactions: message.reactions || {},
    };

    this.data.messages.push(fullMessage);
    this.saveData();
    return fullMessage;
  }

  public toggleReaction(messageId: string, emoji: string, userId: string): Message | null {
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (!msg) return null;

    if (!msg.reactions) {
      msg.reactions = {};
    }

    if (!msg.reactions[emoji]) {
      msg.reactions[emoji] = [];
    }

    const index = msg.reactions[emoji].indexOf(userId);
    if (index > -1) {
      msg.reactions[emoji].splice(index, 1);
      if (msg.reactions[emoji].length === 0) {
        delete msg.reactions[emoji];
      }
    } else {
      msg.reactions[emoji].push(userId);
    }

    this.saveData();
    return msg;
  }

  // --- Calls ---
  public getCalls(): CallLog[] {
    return [...(this.data.calls || [])].sort((a, b) => b.timestamp - a.timestamp);
  }

  public addCall(call: Omit<CallLog, 'id' | 'formattedTime'>): CallLog {
    const id = `call_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const formattedTime = formatTime(call.timestamp);
    const newCall: CallLog = {
      ...call,
      id,
      formattedTime,
    };
    if (!this.data.calls) {
      this.data.calls = [];
    }
    this.data.calls.unshift(newCall);
    this.saveData();
    return newCall;
  }
}

export const storage = new StorageManager();
