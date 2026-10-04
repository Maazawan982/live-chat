import { User, Room, Message, CallLog } from '../types.ts';

const API_BASE = '/api';

function getAuthHeaders(token: string | null): HeadersInit {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const api = {
  // Authentication
  async login(username: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to login');
    }
    return res.json();
  },

  async register(username: string, displayName: string, bio?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName, bio }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register');
    }
    return res.json();
  },

  async verifyMe(token: string): Promise<{ user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Session invalid');
    }
    return res.json();
  },

  // Users
  async getUsers(token: string): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch users');
    }
    const data = await res.json();
    return data.users;
  },

  // Rooms
  async getRooms(token: string): Promise<Room[]> {
    const res = await fetch(`${API_BASE}/rooms`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch rooms');
    }
    const data = await res.json();
    return data.rooms;
  },

  async createRoom(token: string, name: string, description: string, topic?: string): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ name, description, topic }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create room');
    }
    const data = await res.json();
    return data.room;
  },

  async getOrCreateDirectRoom(token: string, targetUserId: string): Promise<Room> {
    const res = await fetch(`${API_BASE}/rooms/direct`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to open direct message room');
    }
    const data = await res.json();
    return data.room;
  },

  // Messages
  async getMessages(token: string, roomId: string): Promise<Message[]> {
    const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(roomId)}/messages`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch messages');
    }
    const data = await res.json();
    return data.messages;
  },

  // Calls
  async getCalls(token: string): Promise<CallLog[]> {
    const res = await fetch(`${API_BASE}/calls`, {
      headers: getAuthHeaders(token),
    });
    if (!res.ok) {
      throw new Error('Failed to fetch call logs');
    }
    const data = await res.json();
    return data.calls;
  },
};
