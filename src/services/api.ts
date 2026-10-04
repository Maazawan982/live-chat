import { User, Room, Message, CallLog } from '../types.ts';
import { serverlessStore } from './serverlessFallback.ts';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '/api';

function getAuthHeaders(token: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function fetchJsonWithTimeout(url: string, options?: RequestInit, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      throw new Error(`HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  // Authentication
  async login(username: string): Promise<{ token: string; user: User }> {
    try {
      return await fetchJsonWithTimeout(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
    } catch {
      return serverlessStore.login(username);
    }
  },

  async register(
    username: string,
    displayName: string,
    bio?: string
  ): Promise<{ token: string; user: User }> {
    try {
      return await fetchJsonWithTimeout(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, bio }),
      });
    } catch {
      return serverlessStore.register(username, displayName, bio);
    }
  },

  async verifyMe(token: string): Promise<{ user: User }> {
    if (token.startsWith('serverless_jwt_')) {
      const user = serverlessStore.decodeToken(token);
      if (user) return { user };
    }
    try {
      return await fetchJsonWithTimeout(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(token),
      });
    } catch {
      const user = serverlessStore.decodeToken(token);
      if (user) return { user };
      throw new Error('Session invalid');
    }
  },

  // Users
  async getUsers(token: string): Promise<User[]> {
    try {
      const data = await fetchJsonWithTimeout(`${API_BASE}/users`, {
        headers: getAuthHeaders(token),
      });
      return data.users;
    } catch {
      return serverlessStore.getUsers();
    }
  },

  // Rooms
  async getRooms(token: string): Promise<Room[]> {
    try {
      const data = await fetchJsonWithTimeout(`${API_BASE}/rooms`, {
        headers: getAuthHeaders(token),
      });
      return data.rooms;
    } catch {
      const user = serverlessStore.decodeToken(token);
      return serverlessStore.getRooms(user?.id || 'user_maaz');
    }
  },

  async createRoom(
    token: string,
    name: string,
    description: string,
    topic?: string
  ): Promise<Room> {
    try {
      const data = await fetchJsonWithTimeout(`${API_BASE}/rooms`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ name, description, topic }),
      });
      return data.room;
    } catch {
      const user = serverlessStore.decodeToken(token);
      return serverlessStore.createRoom(
        name,
        description,
        user?.id || 'user_maaz',
        topic
      );
    }
  },

  async getOrCreateDirectRoom(token: string, targetUserId: string): Promise<Room> {
    try {
      const data = await fetchJsonWithTimeout(`${API_BASE}/rooms/direct`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ targetUserId }),
      });
      return data.room;
    } catch {
      const user = serverlessStore.decodeToken(token);
      return serverlessStore.getOrCreateDirectRoom(user?.id || 'user_maaz', targetUserId);
    }
  },

  // Messages
  async getMessages(token: string, roomId: string): Promise<Message[]> {
    try {
      const data = await fetchJsonWithTimeout(
        `${API_BASE}/rooms/${encodeURIComponent(roomId)}/messages`,
        {
          headers: getAuthHeaders(token),
        }
      );
      return data.messages;
    } catch {
      return serverlessStore.getMessages(roomId);
    }
  },

  // Calls
  async getCalls(token: string): Promise<CallLog[]> {
    try {
      const data = await fetchJsonWithTimeout(`${API_BASE}/calls`, {
        headers: getAuthHeaders(token),
      });
      return data.calls;
    } catch {
      return serverlessStore.getCalls();
    }
  },
};
